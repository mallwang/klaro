import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import { MailerError } from '../../src/services/mailer.service.js';

function makeStubMailer(
  opts: { emailVerificationFails?: Error; confirmationEmailFails?: boolean } = {},
): MailerService {
  return {
    sendInvitationEmail: async () => {},
    sendEmailVerificationEmail: opts.emailVerificationFails
      ? async () => {
          throw new MailerError(opts.emailVerificationFails!.message);
        }
      : async () => {},
    sendEmailChangeConfirmationEmail: opts.confirmationEmailFails
      ? async () => {
          throw new MailerError('SMTP down');
        }
      : async () => {},
  } as unknown as MailerService;
}

async function setup(mailer?: MailerService) {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db, { mailer: mailer ?? makeStubMailer() });
  await app.ready();
  const member = createAuthenticatedSession(db, {
    role: 'MEMBER',
    email: 'member@example.test',
    displayName: 'Member User',
  });
  const admin = createAuthenticatedSession(db, {
    role: 'ADMIN',
    email: 'admin@example.test',
    displayName: 'Admin User',
  });
  return {
    db,
    app,
    memberCookie: member.sessionId,
    memberId: member.userId,
    adminCookie: admin.sessionId,
  };
}

// ─── US1: PATCH /api/profile ──────────────────────────────────────────────────

describe('PATCH /api/profile', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let memberId: string;

  beforeEach(async () => {
    ({ db, app, memberCookie, memberId } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204 and persists the new display name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      payload: { displayName: 'Updated Name' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(204);
    const row = db
      .prepare<[string], { display_name: string }>(`SELECT display_name FROM users WHERE id = ?`)
      .get(memberId);
    expect(row?.display_name).toBe('Updated Name');
  });

  it('returns 400 for an empty display name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      payload: { displayName: '' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a display name exceeding 100 characters', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      payload: { displayName: 'x'.repeat(101) },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without authentication', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile',
      payload: { displayName: 'Updated Name' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── US3: POST /api/profile/email-change ─────────────────────────────────────

describe('POST /api/profile/email-change', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let memberId: string;

  beforeEach(async () => {
    ({ db, app, memberCookie, memberId } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 202 and inserts a token row when mailer succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile/email-change',
      payload: { email: 'new@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(202);
    const row = db
      .prepare<
        [string],
        { new_email: string }
      >(`SELECT new_email FROM email_verifications WHERE user_id = ?`)
      .get(memberId);
    expect(row?.new_email).toBe('new@example.test');
  });

  it('returns 409 when email is already in use', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile/email-change',
      payload: { email: 'admin@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile/email-change',
      payload: { email: 'not-an-email' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile/email-change',
      payload: { email: 'new@example.test' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 502 and deletes the token row when mailer fails', async () => {
    const {
      db: failDb,
      app: failApp,
      memberCookie: failCookie,
      memberId: failMemberId,
    } = await setup(makeStubMailer({ emailVerificationFails: new Error('SMTP error') }));
    try {
      const res = await failApp.inject({
        method: 'POST',
        url: '/api/profile/email-change',
        payload: { email: 'fail@example.test' },
        cookies: { [SESSION_COOKIE_NAME]: failCookie },
      });
      expect(res.statusCode).toBe(502);
      const row = failDb
        .prepare(`SELECT * FROM email_verifications WHERE user_id = ?`)
        .get(failMemberId);
      expect(row).toBeUndefined();
    } finally {
      await failApp.close();
      failDb.close();
    }
  });
});

// ─── US3: GET /api/profile/email-change/pending ───────────────────────────────

describe('GET /api/profile/email-change/pending', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let memberId: string;

  beforeEach(async () => {
    ({ db, app, memberCookie, memberId } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns pendingEmail when a pending row exists', async () => {
    db.prepare(
      `INSERT INTO email_verifications (token, user_id, new_email, expires_at, created_at)
       VALUES ('tok', ?, 'pending@example.test', ?, ?)`,
    ).run(memberId, new Date(Date.now() + 86400000).toISOString(), new Date().toISOString());

    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/email-change/pending',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ pendingEmail: string }>().pendingEmail).toBe('pending@example.test');
  });

  it('returns null pendingEmail when no pending row exists', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/email-change/pending',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<{ pendingEmail: null }>().pendingEmail).toBeNull();
  });

  it('returns 401 without authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/email-change/pending',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── US4: POST /api/profile/email-change/:token/confirm (public) ──────────────

describe('POST /api/profile/email-change/:token/confirm', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let memberId: string;

  beforeEach(async () => {
    ({ db, app, memberCookie, memberId } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  function insertVerificationToken(
    userId: string,
    newEmail: string,
    options: { expired?: boolean } = {},
  ) {
    const token = 'test-' + randomUUID().replace(/-/g, '');
    const expiresAt = options.expired
      ? new Date(Date.now() - 1000).toISOString()
      : new Date(Date.now() + 86400000).toISOString();
    db.prepare(
      `INSERT INTO email_verifications (token, user_id, new_email, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(token, userId, newEmail, expiresAt, new Date().toISOString());
    return token;
  }

  it('returns 200 and updates the email for a valid token', async () => {
    const token = insertVerificationToken(memberId, 'confirmed@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/profile/email-change/${token}/confirm`,
    });
    expect(res.statusCode).toBe(200);
    const user = db
      .prepare<[string], { email: string }>(`SELECT email FROM users WHERE id = ?`)
      .get(memberId);
    expect(user?.email).toBe('confirmed@example.test');
  });

  it('does not require an authenticated session (public route)', async () => {
    const token = insertVerificationToken(memberId, 'public@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/profile/email-change/${token}/confirm`,
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 410 for an expired token', async () => {
    const token = insertVerificationToken(memberId, 'expired@example.test', { expired: true });
    const res = await app.inject({
      method: 'POST',
      url: `/api/profile/email-change/${token}/confirm`,
    });
    expect(res.statusCode).toBe(410);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/profile/email-change/unknown-token/confirm',
    });
    expect(res.statusCode).toBe(404);
  });
});

// ─── US3: confirmation email after email change (US3) ─────────────────────────

describe('POST /api/profile/email-change/:token/confirm — confirmation email (US3)', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberId: string;

  beforeEach(async () => {
    ({ db, app, memberId } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  function insertVerificationToken(userId: string, newEmail: string) {
    const token = 'test-' + randomUUID().replace(/-/g, '');
    db.prepare(
      `INSERT INTO email_verifications (token, user_id, new_email, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      token,
      userId,
      newEmail,
      new Date(Date.now() + 86400000).toISOString(),
      new Date().toISOString(),
    );
    return token;
  }

  it('calls sendEmailChangeConfirmationEmail with the new email after a successful confirm', async () => {
    let capturedTo: string | undefined;
    let capturedChangedAt: string | undefined;
    const trackingMailer: MailerService = {
      sendInvitationEmail: async () => {},
      sendEmailVerificationEmail: async () => {},
      sendEmailChangeConfirmationEmail: async (to: string, changedAt: string) => {
        capturedTo = to;
        capturedChangedAt = changedAt;
      },
    } as unknown as MailerService;

    const { db: tDb, app: tApp, memberId: tMemberId } = await setup(trackingMailer);
    try {
      const token = insertVerificationTokenForApp(tDb, tMemberId, 'newaddr@example.test');
      const res = await tApp.inject({
        method: 'POST',
        url: `/api/profile/email-change/${token}/confirm`,
      });
      expect(res.statusCode).toBe(200);
      await new Promise((r) => setTimeout(r, 20));
      expect(capturedTo).toBe('newaddr@example.test');
      expect(capturedChangedAt).toBeTruthy();
    } finally {
      await tApp.close();
      tDb.close();
    }
  });

  it('still returns 200 when sendEmailChangeConfirmationEmail throws (fire-and-forget)', async () => {
    const {
      db: fDb,
      app: fApp,
      memberId: fMemberId,
    } = await setup(makeStubMailer({ confirmationEmailFails: true }));
    try {
      const token = insertVerificationTokenForApp(fDb, fMemberId, 'failconfirm@example.test');
      const res = await fApp.inject({
        method: 'POST',
        url: `/api/profile/email-change/${token}/confirm`,
      });
      expect(res.statusCode).toBe(200);
    } finally {
      await fApp.close();
      fDb.close();
    }
  });
});

function insertVerificationTokenForApp(db: Database.Database, userId: string, newEmail: string) {
  const token = 'test-' + randomUUID().replace(/-/g, '');
  db.prepare(
    `INSERT INTO email_verifications (token, user_id, new_email, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    token,
    userId,
    newEmail,
    new Date(Date.now() + 86400000).toISOString(),
    new Date().toISOString(),
  );
  return token;
}

// ─── DELETE /api/profile ──────────────────────────────────────────────────────

describe('DELETE /api/profile', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let memberId: string;
  let adminCookie: string;

  beforeEach(async () => {
    ({ db, app, memberCookie, memberId, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/profile' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 204, removes the user row, and clears the session cookie for a MEMBER', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/profile',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(204);
    const row = db
      .prepare<[string], { id: string }>(`SELECT id FROM users WHERE id = ?`)
      .get(memberId);
    expect(row).toBeUndefined();
    const setCookieHeader = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookieHeader)
      ? setCookieHeader.join('; ')
      : (setCookieHeader ?? '');
    expect(cookieStr).toContain(SESSION_COOKIE_NAME);
    expect(cookieStr).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('returns 409 when the sole ADMIN tries to delete their account', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/profile',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json<{ message: string }>();
    expect(body.message).toMatch(/last.*admin|admin/i);
  });
});
