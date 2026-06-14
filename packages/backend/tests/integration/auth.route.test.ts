import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { hashPassword } from '../../src/services/password.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import { MailerError } from '../../src/services/mailer.service.js';

function insertUser(
  db: Database.Database,
  overrides: Partial<{
    email: string;
    displayName: string;
    password: string;
    role: string;
    status: string;
  }> = {},
) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(overrides.password ?? 'right-password');
  db.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    overrides.email ?? `user-${id}@example.test`,
    overrides.displayName ?? 'Test User',
    hash,
    salt,
    overrides.role ?? 'MEMBER',
    overrides.status ?? 'ACTIVE',
    now,
    now,
  );
  return { id, email: overrides.email ?? `user-${id}@example.test` };
}

function findCookie(
  setCookieHeader: string | string[] | undefined,
  name: string,
): string | undefined {
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  return headers.find((h) => h.startsWith(`${name}=`));
}

describe('POST /api/auth/sign-in', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200, sets a session cookie, and returns the session-user shape', async () => {
    const { id, email } = insertUser(db, { password: 'correct-horse', displayName: 'Alice' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'correct-horse' },
    });
    expect(res.statusCode).toBe(200);
    const cookie = findCookie(res.headers['set-cookie'], SESSION_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie).toContain('HttpOnly');
    const body = res.json<{ id: string; email: string; displayName: string; role: string }>();
    expect(body).toEqual({ id, email, displayName: 'Alice', role: 'MEMBER' });
    expect(body).not.toHaveProperty('passwordHash');
    expect(body).not.toHaveProperty('userId');
  });

  it('returns 400 for a malformed body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 with a generic message for the wrong password', async () => {
    const { email } = insertUser(db, { password: 'correct-horse' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'wrong-password' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('invalid email or password');
  });

  it('returns 401 for an unknown email without revealing the account does not exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'nobody@example.test', password: 'whatever123' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 423 for a locked-out account, even with the correct password', async () => {
    const { email } = insertUser(db, { password: 'correct-horse' });
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        payload: { email, password: 'wrong-password' },
      });
    }
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'correct-horse' },
    });
    expect(res.statusCode).toBe(423);
  });
});

describe('POST /api/auth/sign-out', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204, deletes the session row, and clears the cookie', async () => {
    const { sessionId } = createAuthenticatedSession(db);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(res.statusCode).toBe(204);

    const row = db.prepare(`SELECT 1 FROM sessions WHERE id = ?`).get(sessionId);
    expect(row).toBeUndefined();

    const cookie = findCookie(res.headers['set-cookie'], SESSION_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  });
});

describe('GET /api/auth/me', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with the session-user shape for a valid session', async () => {
    const { userId, sessionId } = createAuthenticatedSession(db, {
      displayName: 'Bob',
      role: 'ADMIN',
    });
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; displayName: string; role: string }>();
    expect(body.id).toBe(userId);
    expect(body.displayName).toBe('Bob');
    expect(body.role).toBe('ADMIN');
  });

  it('returns 401 without a valid session', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Global auth requirement on /api/* routes', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 401 for /api/contracts and /api/dashboard without a session, 200 with one', async () => {
    const unauthContracts = await app.inject({ method: 'GET', url: '/api/contracts' });
    expect(unauthContracts.statusCode).toBe(401);
    expect(unauthContracts.json()).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    });

    const unauthDashboard = await app.inject({ method: 'GET', url: '/api/dashboard' });
    expect(unauthDashboard.statusCode).toBe(401);

    const { sessionId } = createAuthenticatedSession(db);
    const authContracts = await app.inject({
      method: 'GET',
      url: '/api/contracts',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(authContracts.statusCode).toBe(200);

    const authDashboard = await app.inject({
      method: 'GET',
      url: '/api/dashboard',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(authDashboard.statusCode).toBe(200);
  });

  it('does not require auth for POST /api/auth/sign-in', async () => {
    const { email } = insertUser(db, { password: 'correct-horse' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'correct-horse' },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('Archived accounts lose access immediately', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it("returns 401 for an archived account's old session cookie on subsequent requests", async () => {
    const { userId: id, sessionId } = createAuthenticatedSession(db, {
      email: 'leaving@example.test',
    });

    const before = await app.inject({
      method: 'GET',
      url: '/api/contracts',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(before.statusCode).toBe(200);

    db.prepare(`UPDATE users SET status = 'ARCHIVED', archived_at = ? WHERE id = ?`).run(
      new Date().toISOString(),
      id,
    );
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(id);

    const after = await app.inject({
      method: 'GET',
      url: '/api/contracts',
      cookies: { [SESSION_COOKIE_NAME]: sessionId },
    });
    expect(after.statusCode).toBe(401);
  });

  it('returns 401 for sign-in attempts against an archived account', async () => {
    const { email } = insertUser(db, { password: 'correct-horse', status: 'ARCHIVED' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'correct-horse' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Sign-in lockout escalation', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('switches from 401 to 423 once the failure threshold is reached', async () => {
    const { email } = insertUser(db, { password: 'correct-horse' });

    // The lockout check runs at the start of sign-in, so the attempt that pushes
    // failed_attempts to the threshold still reports 401 — the *next* attempt sees the lock.
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        payload: { email, password: 'wrong-password' },
      });
      expect(res.statusCode).toBe(401);
    }

    const lockingRes = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'wrong-password' },
    });
    expect(lockingRes.statusCode).toBe(423);

    const lockedRes = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'correct-horse' },
    });
    expect(lockedRes.statusCode).toBe(423);
  });
});

describe('POST /api/auth/password', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204, re-hashes the password, keeps the current session, and signs out other sessions', async () => {
    const { email } = insertUser(db, { password: 'old-password123' });

    const signInA = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'old-password123' },
    });
    const signInB = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'old-password123' },
    });
    const cookieA = findCookie(signInA.headers['set-cookie'], SESSION_COOKIE_NAME)!
      .split(';')[0]!
      .split('=')[1]!;
    const cookieB = findCookie(signInB.headers['set-cookie'], SESSION_COOKIE_NAME)!
      .split(';')[0]!
      .split('=')[1]!;

    const changeRes = await app.inject({
      method: 'POST',
      url: '/api/auth/password',
      cookies: { [SESSION_COOKIE_NAME]: cookieA },
      payload: { currentPassword: 'old-password123', newPassword: 'new-password456' },
    });
    expect(changeRes.statusCode).toBe(204);

    const meWithA = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { [SESSION_COOKIE_NAME]: cookieA },
    });
    expect(meWithA.statusCode).toBe(200);

    const meWithB = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      cookies: { [SESSION_COOKIE_NAME]: cookieB },
    });
    expect(meWithB.statusCode).toBe(401);

    const signInWithNew = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'new-password456' },
    });
    expect(signInWithNew.statusCode).toBe(200);
  });

  it('returns 401 when the current password is wrong', async () => {
    const { email } = insertUser(db, { password: 'right-current-pass' });
    const signIn = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'right-current-pass' },
    });
    const cookie = findCookie(signIn.headers['set-cookie'], SESSION_COOKIE_NAME)!
      .split(';')[0]!
      .split('=')[1]!;

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/password',
      cookies: { [SESSION_COOKIE_NAME]: cookie },
      payload: { currentPassword: 'totally-wrong', newPassword: 'new-password456' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/password — password change email (fire-and-forget)', () => {
  it('calls sendPasswordChangeEmail with the user email after a successful change', async () => {
    let capturedTo: string | undefined;
    let capturedLink: string | undefined;
    const trackingMailer: MailerService = {
      sendPasswordChangeEmail: async (to: string, link: string) => {
        capturedTo = to;
        capturedLink = link;
      },
    } as unknown as MailerService;

    const db = createDb(':memory:');
    runMigrations(db);
    const app = await buildServer(db, { mailer: trackingMailer });
    await app.ready();

    try {
      const { email } = insertUser(db, { email: 'pwchange@example.test', password: 'old-pass123' });
      const signIn = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        payload: { email, password: 'old-pass123' },
      });
      const cookie = findCookie(signIn.headers['set-cookie'], SESSION_COOKIE_NAME)!
        .split(';')[0]!
        .split('=')[1]!;

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/password',
        cookies: { [SESSION_COOKIE_NAME]: cookie },
        payload: { currentPassword: 'old-pass123', newPassword: 'new-pass456' },
      });
      expect(res.statusCode).toBe(204);
      await new Promise((r) => setTimeout(r, 20));
      expect(capturedTo).toBe('pwchange@example.test');
      expect(capturedLink).toContain('/sign-in');
    } finally {
      await app.close();
      db.close();
    }
  });

  it('still returns 204 when sendPasswordChangeEmail throws (fire-and-forget)', async () => {
    const failMailer: MailerService = {
      sendPasswordChangeEmail: async () => {
        throw new MailerError('SMTP down');
      },
    } as unknown as MailerService;

    const db = createDb(':memory:');
    runMigrations(db);
    const app = await buildServer(db, { mailer: failMailer });
    await app.ready();

    try {
      const { email } = insertUser(db, { email: 'pwfail@example.test', password: 'old-pass123' });
      const signIn = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in',
        payload: { email, password: 'old-pass123' },
      });
      const cookie = findCookie(signIn.headers['set-cookie'], SESSION_COOKIE_NAME)!
        .split(';')[0]!
        .split('=')[1]!;

      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/password',
        cookies: { [SESSION_COOKIE_NAME]: cookie },
        payload: { currentPassword: 'old-pass123', newPassword: 'new-pass456' },
      });
      expect(res.statusCode).toBe(204);
    } finally {
      await app.close();
      db.close();
    }
  });
});

describe('POST /api/auth/forgot-password', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let capturedTo: string | undefined;
  let capturedLink: string | undefined;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    capturedTo = undefined;
    capturedLink = undefined;
    const stubMailer: MailerService = {
      sendPasswordResetEmail: async (to: string, link: string) => {
        capturedTo = to;
        capturedLink = link;
      },
    } as unknown as MailerService;
    app = await buildServer(db, { mailer: stubMailer });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 202 with generic message for existing email', async () => {
    const { email } = insertUser(db);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ message: string }>();
    expect(body.message).toMatch(/If an account exists/);
    expect(capturedTo).toBe(email);
    expect(capturedLink).toBeTruthy();
  });

  it('returns 202 with generic message for non-existent email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'nonexistent@example.test' },
    });
    expect(res.statusCode).toBe(202);
    const body = res.json<{ message: string }>();
    expect(body.message).toMatch(/If an account exists/);
    expect(capturedTo).toBeUndefined();
  });

  it('returns 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('sends email with reset link containing token', async () => {
    const { email } = insertUser(db);
    await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    expect(capturedLink).toMatch(/\/reset-password\//);
  });
});

describe('POST /api/auth/reset-password/:token', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = createDb(':memory:');
    runMigrations(db);
    app = await buildServer(db);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200, creates a session, and returns the user for valid token', async () => {
    const { id: userId, email } = insertUser(db, { password: 'old-pass' });
    // Request password reset to get token
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    expect(resetRes.statusCode).toBe(202);
    // Extract token from database (since we didn't capture mailer)
    const row = db
      .prepare(
        `SELECT token FROM email_verifications WHERE user_id = ? AND purpose = 'password-reset'`,
      )
      .get(userId) as { token: string };
    expect(row).toBeDefined();
    const token = row.token;

    const res = await app.inject({
      method: 'POST',
      url: `/api/auth/reset-password/${token}`,
      payload: { password: 'new-pass-123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ id: string; email: string; displayName: string; role: string }>();
    expect(body.email).toBe(email);
    expect(body.id).toBe(userId);
    // Verify session cookie was set
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('session_id=');
    // Verify new password works
    const signIn = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email, password: 'new-pass-123' },
    });
    expect(signIn.statusCode).toBe(200);
  });

  it('returns 404 for invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password/invalid-token',
      payload: { password: 'new-pass-123' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 404 for expired token', async () => {
    const { id: userId, email } = insertUser(db);
    // Request reset
    await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    const row = db
      .prepare(
        `SELECT token FROM email_verifications WHERE user_id = ? AND purpose = 'password-reset'`,
      )
      .get(userId) as { token: string };
    // Expire the token
    db.prepare(
      `UPDATE email_verifications SET expires_at = datetime('now', '-1 hour') WHERE token = ?`,
    ).run(row.token);
    const res = await app.inject({
      method: 'POST',
      url: `/api/auth/reset-password/${row.token}`,
      payload: { password: 'new-pass-123' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for weak password', async () => {
    const { id: userId, email } = insertUser(db);
    await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    const row = db
      .prepare(
        `SELECT token FROM email_verifications WHERE user_id = ? AND purpose = 'password-reset'`,
      )
      .get(userId) as { token: string };
    const res = await app.inject({
      method: 'POST',
      url: `/api/auth/reset-password/${row.token}`,
      payload: { password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('token is single-use (second attempt fails)', async () => {
    const { id: userId, email } = insertUser(db);
    await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    const row = db
      .prepare(
        `SELECT token FROM email_verifications WHERE user_id = ? AND purpose = 'password-reset'`,
      )
      .get(userId) as { token: string };
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/auth/reset-password/${row.token}`,
      payload: { password: 'new-pass-123' },
    });
    expect(res1.statusCode).toBe(200);
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/auth/reset-password/${row.token}`,
      payload: { password: 'another-pass-456' },
    });
    expect(res2.statusCode).toBe(404);
  });
});
