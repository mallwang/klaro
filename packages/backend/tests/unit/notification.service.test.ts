import { describe, it, expect, vi } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { computeNextSendAt, NotificationService } from '../../src/services/notification.service.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import type { SummaryEmailData } from '@pcm/shared';

/**
 * Tests for computeNextSendAt and NotificationService.
 */

// ── computeNextSendAt – WEEKLY ────────────────────────────────────────────────

describe('computeNextSendAt – WEEKLY', () => {
  it('returns the same Monday at 10:00 UTC when it is Monday before 10:00', () => {
    // 2026-06-15 is a Monday; 09:59 UTC is before the send window
    const now = new Date('2026-06-15T09:59:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-15T10:00:00.000Z');
  });

  it('returns next Monday when it is Monday at exactly 10:00 UTC', () => {
    const now = new Date('2026-06-15T10:00:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-22T10:00:00.000Z');
  });

  it('returns next Monday when it is Monday after 10:00 UTC', () => {
    const now = new Date('2026-06-15T11:00:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-22T10:00:00.000Z');
  });

  it('returns next Monday when it is a Tuesday', () => {
    const now = new Date('2026-06-16T08:00:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-22T10:00:00.000Z');
  });

  it('returns next Monday when it is a Sunday', () => {
    const now = new Date('2026-06-14T12:00:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-15T10:00:00.000Z');
  });

  it('returns next Monday when it is a Friday', () => {
    const now = new Date('2026-06-19T12:00:00.000Z');
    expect(computeNextSendAt('WEEKLY', now)).toBe('2026-06-22T10:00:00.000Z');
  });
});

// ── computeNextSendAt – MONTHLY ───────────────────────────────────────────────

describe('computeNextSendAt – MONTHLY', () => {
  it('returns the same 1st at 10:00 UTC when it is the 1st before 10:00', () => {
    const now = new Date('2026-06-01T09:00:00.000Z');
    expect(computeNextSendAt('MONTHLY', now)).toBe('2026-06-01T10:00:00.000Z');
  });

  it('returns the 1st of next month when it is the 1st at 10:00 UTC', () => {
    const now = new Date('2026-06-01T10:00:00.000Z');
    expect(computeNextSendAt('MONTHLY', now)).toBe('2026-07-01T10:00:00.000Z');
  });

  it('returns the 1st of next month when it is a non-1st day', () => {
    const now = new Date('2026-06-15T12:00:00.000Z');
    expect(computeNextSendAt('MONTHLY', now)).toBe('2026-07-01T10:00:00.000Z');
  });

  it('handles December → January year boundary correctly', () => {
    const now = new Date('2026-12-15T12:00:00.000Z');
    expect(computeNextSendAt('MONTHLY', now)).toBe('2027-01-01T10:00:00.000Z');
  });

  it('handles December 1st before 10:00 UTC', () => {
    const now = new Date('2026-12-01T09:00:00.000Z');
    expect(computeNextSendAt('MONTHLY', now)).toBe('2026-12-01T10:00:00.000Z');
  });
});

// ── NotificationService helpers ───────────────────────────────────────────────

function makeDb(): Database.Database {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  return db;
}

function insertUser(
  db: Database.Database,
  opts: {
    id?: string;
    email?: string;
    enabled?: boolean;
    frequency?: 'WEEKLY' | 'MONTHLY' | null;
  } = {},
): string {
  const id = opts.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users
       (id, email, display_name, password_hash, password_salt, role, status,
        summary_email_enabled, summary_email_frequency, created_at, updated_at)
     VALUES (?, ?, 'Test User', 'h', 's', 'MEMBER', 'ACTIVE', ?, ?, ?, ?)`,
  ).run(
    id,
    opts.email ?? `${id}@example.test`,
    opts.enabled ? 1 : 0,
    opts.frequency ?? null,
    now,
    now,
  );
  return id;
}

function insertContract(
  db: Database.Database,
  userId: string,
  opts: {
    name?: string;
    amount?: number;
    billingInterval?: string;
    endDate?: string;
    anonymize?: boolean;
    status?: string;
  } = {},
): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO contracts
       (id, user_id, name, category, amount, billing_interval, status,
        end_date, anonymize, created_at, updated_at)
     VALUES (?, ?, ?, 'OTHER', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    opts.name ?? 'Test Contract',
    opts.amount ?? 10,
    opts.billingInterval ?? 'MONTHLY',
    opts.status ?? 'ACTIVE',
    opts.endDate ?? null,
    opts.anonymize ? 1 : 0,
    now,
    now,
  );
  return id;
}

function makeCapturingMailer(): {
  mailer: MailerService;
  captured: SummaryEmailData[];
  capturedLocales: string[];
} {
  const captured: SummaryEmailData[] = [];
  const capturedLocales: string[] = [];
  const mailer = {
    sendSummaryEmail: async (data: SummaryEmailData, locale?: string) => {
      captured.push(data);
      capturedLocales.push(locale ?? 'en');
    },
  } as unknown as MailerService;
  return { mailer, captured, capturedLocales };
}

// ── NotificationService – sendSummaryEmailForUser ─────────────────────────────

describe('NotificationService.sendSummaryEmailForUser', () => {
  it('sets ctaState to no-contracts when the user has no active contracts', async () => {
    const db = makeDb();
    const userId = insertUser(db, { enabled: true, frequency: 'WEEKLY' });
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmailForUser(userId);

    expect(captured).toHaveLength(1);
    expect(captured[0]!.ctaState).toBe('no-contracts');
    db.close();
  });

  it('sets ctaState to cancellation-due when there are upcoming renewals', async () => {
    const db = makeDb();
    const userId = insertUser(db, { enabled: true, frequency: 'WEEKLY' });
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    insertContract(db, userId, { endDate: tomorrow });
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmailForUser(userId);

    expect(captured[0]!.ctaState).toBe('cancellation-due');
    db.close();
  });

  it('sets ctaState to none when there are contracts but no upcoming renewals', async () => {
    const db = makeDb();
    const userId = insertUser(db, { enabled: true, frequency: 'WEEKLY' });
    insertContract(db, userId);
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmailForUser(userId);

    expect(captured[0]!.ctaState).toBe('none');
    db.close();
  });

  it('always uses the real contract name regardless of the anonymize flag', async () => {
    const db = makeDb();
    const userId = insertUser(db, { enabled: true, frequency: 'WEEKLY' });
    insertContract(db, userId, { name: 'Secret Contract', anonymize: true });
    insertContract(db, userId, { name: 'Visible Contract', anonymize: false });
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmailForUser(userId);

    const names = captured[0]!.contracts.map((c) => c.name);
    expect(names).toContain('Secret Contract');
    expect(names).toContain('Visible Contract');
    db.close();
  });

  it('forwards the user email_language as locale to sendSummaryEmail', async () => {
    const db = makeDb();
    const userId = insertUser(db, { enabled: true, frequency: 'WEEKLY' });
    db.prepare(`UPDATE users SET email_language = 'de' WHERE id = ?`).run(userId);
    const { mailer, capturedLocales } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmailForUser(userId);

    expect(capturedLocales[0]).toBe('de');
    db.close();
  });
});

// ── NotificationService – sendSummaryEmails ───────────────────────────────────

describe('NotificationService.sendSummaryEmails', () => {
  it('only sends to users with the matching frequency and enabled=1', async () => {
    const db = makeDb();
    insertUser(db, { email: 'weekly@example.test', enabled: true, frequency: 'WEEKLY' });
    insertUser(db, { email: 'monthly@example.test', enabled: true, frequency: 'MONTHLY' });
    insertUser(db, { email: 'disabled@example.test', enabled: false, frequency: 'WEEKLY' });
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmails('WEEKLY');

    expect(captured).toHaveLength(1);
    expect(captured[0]!.userEmail).toBe('weekly@example.test');
    db.close();
  });

  it('sends only to MONTHLY users when frequency is MONTHLY', async () => {
    const db = makeDb();
    insertUser(db, { email: 'weekly@example.test', enabled: true, frequency: 'WEEKLY' });
    insertUser(db, { email: 'monthly@example.test', enabled: true, frequency: 'MONTHLY' });
    const { mailer, captured } = makeCapturingMailer();
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    await service.sendSummaryEmails('MONTHLY');

    expect(captured).toHaveLength(1);
    expect(captured[0]!.userEmail).toBe('monthly@example.test');
    db.close();
  });

  it('continues processing other users when one send fails', async () => {
    const db = makeDb();
    insertUser(db, { email: 'first@example.test', enabled: true, frequency: 'WEEKLY' });
    insertUser(db, { email: 'second@example.test', enabled: true, frequency: 'WEEKLY' });
    const sent: string[] = [];
    let firstCall = true;
    const mailer = {
      sendSummaryEmail: async (data: SummaryEmailData) => {
        if (firstCall) {
          firstCall = false;
          throw new Error('SMTP failure');
        }
        sent.push(data.userEmail);
      },
    } as unknown as MailerService;
    const service = new NotificationService(db, mailer, 'http://localhost:5173');

    // Should not throw even though the first send failed
    await expect(service.sendSummaryEmails('WEEKLY')).resolves.not.toThrow();
    expect(sent).toHaveLength(1);
    db.close();
  });
});
