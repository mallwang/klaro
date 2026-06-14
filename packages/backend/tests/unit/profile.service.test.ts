import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations } from '../../src/db/client.js';
import { ProfileService } from '../../src/services/profile.service.js';
import { hashPassword } from '../../src/services/password.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{ email: string; displayName: string; status: string }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword('password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'MEMBER', ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    overrides.displayName ?? 'Test User',
    hash,
    salt,
    overrides.status ?? 'ACTIVE',
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

interface EmailVerificationRow {
  token: string;
  user_id: string;
  new_email: string;
  expires_at: string;
  created_at: string;
}

// ─── US1: updateDisplayName ───────────────────────────────────────────────────

describe('ProfileService – updateDisplayName', () => {
  let db: Database.Database;
  let service: ProfileService;
  let userId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    userId = insertUser(db, { email: 'user@example.test', displayName: 'Old Name' }).id;
    service = new ProfileService(db);
  });

  afterEach(() => db.close());

  it('returns "updated" and persists the new display name', () => {
    const result = service.updateDisplayName(userId, 'New Name');
    expect(result).toBe('updated');
    const row = db
      .prepare<[string], { display_name: string }>(`SELECT display_name FROM users WHERE id = ?`)
      .get(userId);
    expect(row?.display_name).toBe('New Name');
  });

  it('returns "not-found" for an unknown user ID', () => {
    expect(service.updateDisplayName(randomUUID(), 'New Name')).toBe('not-found');
  });
});

// ─── US3: requestEmailChange ──────────────────────────────────────────────────

describe('ProfileService – requestEmailChange', () => {
  let db: Database.Database;
  let service: ProfileService;
  let userId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    userId = insertUser(db, { email: 'user@example.test' }).id;
    service = new ProfileService(db);
  });

  afterEach(() => db.close());

  it('returns "requested" and inserts a token row for a fresh email', () => {
    const result = service.requestEmailChange(userId, 'new@example.test');
    expect(result).toMatchObject({ outcome: 'requested' });
    if (result.outcome !== 'requested') throw new Error('unexpected outcome');
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    const row = db
      .prepare<
        [string],
        EmailVerificationRow
      >(`SELECT * FROM email_verifications WHERE user_id = ?`)
      .get(userId);
    expect(row?.new_email).toBe('new@example.test');
  });

  it('supersedes the previous token when the user re-requests', () => {
    const first = service.requestEmailChange(userId, 'first@example.test');
    const second = service.requestEmailChange(userId, 'second@example.test');
    expect(first.outcome).toBe('requested');
    expect(second.outcome).toBe('requested');
    if (first.outcome !== 'requested' || second.outcome !== 'requested') throw new Error();
    const rows = db.prepare<[], EmailVerificationRow>(`SELECT * FROM email_verifications`).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.new_email).toBe('second@example.test');
  });

  it('returns "duplicate" when new email is in use by another ACTIVE user', () => {
    insertUser(db, { email: 'taken@example.test', status: 'ACTIVE' });
    const result = service.requestEmailChange(userId, 'taken@example.test');
    expect(result).toMatchObject({ outcome: 'duplicate' });
  });

  it('returns "not-found" for an unknown user ID', () => {
    const result = service.requestEmailChange(randomUUID(), 'new@example.test');
    expect(result).toMatchObject({ outcome: 'not-found' });
  });
});

// ─── US3: getPendingEmailChange ───────────────────────────────────────────────

describe('ProfileService – getPendingEmailChange', () => {
  let db: Database.Database;
  let service: ProfileService;
  let userId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    userId = insertUser(db, { email: 'user@example.test' }).id;
    service = new ProfileService(db);
  });

  afterEach(() => db.close());

  it('returns the pending email when a non-expired token exists', () => {
    service.requestEmailChange(userId, 'new@example.test');
    const result = service.getPendingEmailChange(userId);
    expect(result).toEqual({ pendingEmail: 'new@example.test' });
  });

  it('returns null and deletes the row when the token is expired', () => {
    service.requestEmailChange(userId, 'expired@example.test');
    db.prepare(`UPDATE email_verifications SET expires_at = ? WHERE user_id = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      userId,
    );
    expect(service.getPendingEmailChange(userId)).toBeNull();
    const row = db.prepare(`SELECT * FROM email_verifications WHERE user_id = ?`).get(userId);
    expect(row).toBeUndefined();
  });

  it('returns null when no pending row exists', () => {
    expect(service.getPendingEmailChange(userId)).toBeNull();
  });
});

// ─── US4: confirmEmailChange ──────────────────────────────────────────────────

describe('ProfileService – confirmEmailChange', () => {
  let db: Database.Database;
  let service: ProfileService;
  let userId: string;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    userId = insertUser(db, { email: 'user@example.test' }).id;
    service = new ProfileService(db);
  });

  afterEach(() => db.close());

  it('returns "confirmed", updates the email, and deletes the token row', () => {
    const req = service.requestEmailChange(userId, 'confirmed@example.test');
    if (req.outcome !== 'requested') throw new Error('unexpected');
    const result = service.confirmEmailChange(req.token);
    expect(result).toBe('confirmed');
    const user = db
      .prepare<[string], { email: string }>(`SELECT email FROM users WHERE id = ?`)
      .get(userId);
    expect(user?.email).toBe('confirmed@example.test');
    const row = db.prepare(`SELECT * FROM email_verifications WHERE token = ?`).get(req.token);
    expect(row).toBeUndefined();
  });

  it('returns "expired" and deletes the row for an expired token', () => {
    const req = service.requestEmailChange(userId, 'expired@example.test');
    if (req.outcome !== 'requested') throw new Error('unexpected');
    db.prepare(`UPDATE email_verifications SET expires_at = ? WHERE token = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      req.token,
    );
    expect(service.confirmEmailChange(req.token)).toBe('expired');
    const row = db.prepare(`SELECT * FROM email_verifications WHERE token = ?`).get(req.token);
    expect(row).toBeUndefined();
  });

  it('returns "not-found" for an unknown token', () => {
    expect(service.confirmEmailChange('nonexistent-token')).toBe('not-found');
  });
});
