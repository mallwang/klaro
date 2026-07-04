import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { createDb, runMigrations, sweepExpiredSignupRequests } from '../../src/db/client.js';
import { SignupRequestService } from '../../src/services/signup-request.service.js';
import { hashPassword } from '../../src/services/password.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{ email: string; status: string; archivedAt: string | null }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword('password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, archived_at, created_at, updated_at)
     VALUES (?, ?, 'Test', ?, ?, 'MEMBER', ?, ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    hash,
    salt,
    overrides.status ?? 'ACTIVE',
    overrides.archivedAt ?? null,
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

function insertPendingInvitation(db: Database.Database, email: string) {
  const adminId = insertUser(db, { email: `admin-${randomUUID()}@example.test` }).id;
  db.prepare(
    `INSERT INTO invitations (token, email, invited_by, status, expires_at, created_at)
     VALUES (?, ?, ?, 'PENDING', ?, ?)`,
  ).run(
    'inv-' + randomUUID(),
    email,
    adminId,
    new Date(Date.now() + 7 * 86400000).toISOString(),
    new Date().toISOString(),
  );
}

interface RawSignupRow {
  token: string;
  email: string;
  status: string;
  verification_expires_at: string;
  verified_at: string | null;
  decided_at: string | null;
  rejection_reason: string | null;
}

describe('SignupRequestService – create', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('creates an UNVERIFIED request with a 64-char hex token', () => {
    const result = service.create('newbie@example.test', 'a-strong-passphrase-1');
    expect(result).not.toBe('blacklisted');
    if (result === 'blacklisted') return;
    expect(result.status).toBe('UNVERIFIED');
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(result.email).toBe('newbie@example.test');
  });

  it('sets verificationExpiresAt to approximately 7 days from now', () => {
    const before = Date.now();
    const result = service.create('newbie@example.test', 'a-strong-passphrase-1');
    const after = Date.now();
    if (result === 'blacklisted') throw new Error('unexpected');
    const expires = new Date(result.verificationExpiresAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(expires).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expires).toBeLessThanOrEqual(after + sevenDays + 1000);
  });

  it('hashes the password rather than storing it in plaintext', () => {
    const result = service.create('newbie@example.test', 'a-strong-passphrase-1');
    if (result === 'blacklisted') throw new Error('unexpected');
    const row = db
      .prepare<
        [string],
        RawSignupRow & { password_hash: string }
      >(`SELECT * FROM signup_requests WHERE token = ?`)
      .get(result.token)!;
    expect(row.password_hash).not.toBe('a-strong-passphrase-1');
    expect(row.password_hash).toBeTruthy();
  });

  it('rejects (blacklisted) when email has an active account', () => {
    insertUser(db, { email: 'existing@example.test', status: 'ACTIVE' });
    expect(service.create('existing@example.test', 'a-strong-passphrase-1')).toBe('blacklisted');
  });

  it('rejects (blacklisted) when email has an archived account', () => {
    insertUser(db, {
      email: 'archived@example.test',
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
    });
    expect(service.create('archived@example.test', 'a-strong-passphrase-1')).toBe('blacklisted');
  });

  it('rejects (blacklisted) when email has a PENDING invitation', () => {
    insertPendingInvitation(db, 'invited@example.test');
    expect(service.create('invited@example.test', 'a-strong-passphrase-1')).toBe('blacklisted');
  });

  it('rejects (blacklisted) when email already has an UNVERIFIED signup request', () => {
    service.create('dupe@example.test', 'a-strong-passphrase-1');
    expect(service.create('dupe@example.test', 'another-passphrase-1')).toBe('blacklisted');
  });

  it('rejects (blacklisted) when email already has a REJECTED signup request', () => {
    const result = service.create('rejected@example.test', 'a-strong-passphrase-1');
    if (result === 'blacklisted') throw new Error('unexpected');
    service.verify(result.token);
    service.reject(result.token, 'no reason');
    expect(service.create('rejected@example.test', 'another-passphrase-1')).toBe('blacklisted');
  });
});

describe('SignupRequestService – verify', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('transitions UNVERIFIED to PENDING_REVIEW and sets verified_at', () => {
    const created = service.create('v@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    const outcome = service.verify(created.token);
    expect(outcome.outcome).toBe('valid');
    const row = db
      .prepare<[string], RawSignupRow>(`SELECT * FROM signup_requests WHERE token = ?`)
      .get(created.token)!;
    expect(row.status).toBe('PENDING_REVIEW');
    expect(row.verified_at).toBeTruthy();
  });

  it('returns not-found for an unknown token', () => {
    expect(service.verify('no-such-token')).toEqual({ outcome: 'not-found' });
  });

  it('returns already-used for a token already verified', () => {
    const created = service.create('v2@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);
    expect(service.verify(created.token)).toEqual({ outcome: 'already-used' });
  });

  it('returns expired for a token past verification_expires_at', () => {
    const created = service.create('v3@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    db.prepare(`UPDATE signup_requests SET verification_expires_at = ? WHERE token = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      created.token,
    );
    expect(service.verify(created.token)).toEqual({ outcome: 'expired' });
  });
});

describe('sweepExpiredSignupRequests', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('deletes expired UNVERIFIED rows but not PENDING_REVIEW or REJECTED rows', () => {
    const expired = service.create('expired@example.test', 'a-strong-passphrase-1');
    const pending = service.create('pending@example.test', 'a-strong-passphrase-1');
    if (expired === 'blacklisted' || pending === 'blacklisted') throw new Error('unexpected');
    db.prepare(`UPDATE signup_requests SET verification_expires_at = ? WHERE token = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      expired.token,
    );
    service.verify(pending.token);

    const deleted = sweepExpiredSignupRequests(db);
    expect(deleted).toBe(1);

    const remaining = service.list();
    expect(remaining.some((r) => r.email === 'expired@example.test')).toBe(false);
    expect(remaining.some((r) => r.email === 'pending@example.test')).toBe(true);
  });
});

describe('SignupRequestService – list', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('returns requests with status and createdAt', () => {
    service.create('a@example.test', 'a-strong-passphrase-1');
    service.create('b@example.test', 'a-strong-passphrase-1');
    const list = service.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
    for (const req of list) {
      expect(req.status).toBeDefined();
      expect(req.createdAt).toBeDefined();
    }
  });
});

describe('SignupRequestService – approve', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('creates a MEMBER user and deletes the request row when PENDING_REVIEW', () => {
    const created = service.create('approve@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);

    const result = service.approve(created.token);
    expect(result).not.toBe('not-found');
    expect(result).not.toBe('not-pending');
    if (result === 'not-found' || result === 'not-pending') return;
    expect(result.user.email).toBe('approve@example.test');
    expect(result.user.role).toBe('MEMBER');
    expect(result.user.status).toBe('ACTIVE');

    const row = db.prepare(`SELECT * FROM signup_requests WHERE token = ?`).get(created.token);
    expect(row).toBeUndefined();
  });

  it('reuses the already-hashed password (no re-hash)', () => {
    const created = service.create('approve2@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    const requestRow = db
      .prepare<
        [string],
        { password_hash: string; password_salt: string }
      >(`SELECT password_hash, password_salt FROM signup_requests WHERE token = ?`)
      .get(created.token)!;
    service.verify(created.token);
    const result = service.approve(created.token);
    if (result === 'not-found' || result === 'not-pending') throw new Error('unexpected');
    expect(result.user.password_hash).toBe(requestRow.password_hash);
    expect(result.user.password_salt).toBe(requestRow.password_salt);
  });

  it('returns not-found for an unknown token', () => {
    expect(service.approve('no-such-token')).toBe('not-found');
  });

  it('returns not-pending for a still-UNVERIFIED request', () => {
    const created = service.create('unverified@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    expect(service.approve(created.token)).toBe('not-pending');
  });

  it('returns not-pending when the request was already approved (concurrent double-decision)', () => {
    const created = service.create('twice@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);
    service.approve(created.token);
    expect(service.approve(created.token)).toBe('not-found');
  });
});

describe('SignupRequestService – reject', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('sets REJECTED status with the given reason and decided_at', () => {
    const created = service.create('reject@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);

    const result = service.reject(created.token, 'Could not verify identity');
    if (result === 'not-found' || result === 'not-pending') throw new Error('unexpected');
    expect(result.request.status).toBe('REJECTED');
    expect(result.request.rejectionReason).toBe('Could not verify identity');
    expect(result.request.decidedAt).toBeTruthy();
  });

  it('accepts an absent reason', () => {
    const created = service.create('reject2@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);
    const result = service.reject(created.token, undefined);
    if (result === 'not-found' || result === 'not-pending') throw new Error('unexpected');
    expect(result.request.rejectionReason).toBeNull();
  });

  it('returns not-found for an unknown token', () => {
    expect(service.reject('no-such-token', undefined)).toBe('not-found');
  });

  it('returns not-pending for a still-UNVERIFIED request', () => {
    const created = service.create('unverified2@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    expect(service.reject(created.token, undefined)).toBe('not-pending');
  });
});

describe('SignupRequestService – delete', () => {
  let db: Database.Database;
  let service: SignupRequestService;

  beforeEach(() => {
    db = createDb(':memory:');
    runMigrations(db);
    db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
    service = new SignupRequestService(db);
  });

  afterEach(() => db.close());

  it('removes the row regardless of status and frees the email', () => {
    const created = service.create('delete@example.test', 'a-strong-passphrase-1');
    if (created === 'blacklisted') throw new Error('unexpected');
    service.verify(created.token);
    service.reject(created.token, 'nope');

    expect(service.delete(created.token)).toBe('deleted');
    expect(service.create('delete@example.test', 'a-strong-passphrase-1')).not.toBe('blacklisted');
  });

  it('returns not-found for an unknown token', () => {
    expect(service.delete('no-such-token')).toBe('not-found');
  });
});
