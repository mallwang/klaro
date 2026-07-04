import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import { MailerError } from '../../src/services/mailer.service.js';

function makeStubMailer(failWith?: Error): MailerService {
  return {
    sendSignupVerificationEmail: failWith
      ? async () => {
          throw new MailerError(failWith.message);
        }
      : async () => {
          /* no-op */
        },
    sendAdminSignupNotificationEmail: async () => {
      /* no-op */
    },
    sendSignupRejectionEmail: async () => {
      /* no-op */
    },
    sendWelcomeEmail: async () => {
      /* no-op */
    },
  } as unknown as MailerService;
}

async function setup(mailer?: MailerService) {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db, { mailer: mailer ?? makeStubMailer() });
  await app.ready();
  const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
  const member = createAuthenticatedSession(db, { role: 'MEMBER', email: 'member@example.test' });
  return { db, app, adminCookie: admin.sessionId, memberCookie: member.sessionId };
}

describe('POST /api/signup', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ db, app } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 201 with the request data on success (public, no session required)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'newsignup@example.test', password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ token: string; email: string; status: string }>();
    expect(body.email).toBe('newsignup@example.test');
    expect(body.status).toBe('UNVERIFIED');
    expect(body.token).toBeTruthy();
  });

  it('returns 400 for a malformed email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'not-an-email', password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a weak password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'weak@example.test', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for a duplicate/blacklisted email (existing account)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'member@example.test', password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 409 when resubmitting the same address before verification', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'dupe@example.test', password: 'a-strong-passphrase-1' },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'dupe@example.test', password: 'another-passphrase-1' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 502 and rolls back when the verification email fails to send', async () => {
    const { app: failApp, db: failDb } = await setup(makeStubMailer(new Error('SMTP error')));
    try {
      const res = await failApp.inject({
        method: 'POST',
        url: '/api/signup',
        payload: { email: 'failmail@example.test', password: 'a-strong-passphrase-1' },
      });
      expect(res.statusCode).toBe(502);
      const count = failDb
        .prepare<
          [],
          { n: number }
        >(`SELECT COUNT(*) AS n FROM signup_requests WHERE email = 'failmail@example.test'`)
        .get()!;
      expect(count.n).toBe(0);
    } finally {
      await failApp.close();
      failDb.close();
    }
  });
});

describe('POST /api/signup/:token/verify', () => {
  let db: Database.Database;
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ db, app } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  async function submitSignup(email: string): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email, password: 'a-strong-passphrase-1' },
    });
    return res.json<{ token: string }>().token;
  }

  it('returns 200 and marks the request PENDING_REVIEW (public route, no session required)', async () => {
    const token = await submitSignup('verify@example.test');
    const res = await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ email: string; status: string }>();
    expect(body.email).toBe('verify@example.test');
    expect(body.status).toBe('PENDING_REVIEW');
  });

  it('sends a notification email to every active admin', async () => {
    const notified: string[] = [];
    const trackingMailer: MailerService = {
      sendSignupVerificationEmail: async () => {},
      sendAdminSignupNotificationEmail: async (to: string) => {
        notified.push(to);
      },
    } as unknown as MailerService;
    const { app: tApp, db: tDb } = await setup(trackingMailer);
    try {
      const res = await tApp.inject({
        method: 'POST',
        url: '/api/signup',
        payload: { email: 'notifyme@example.test', password: 'a-strong-passphrase-1' },
      });
      const token = res.json<{ token: string }>().token;
      await tApp.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
      await new Promise((r) => setTimeout(r, 20));
      expect(notified).toContain('admin@example.test');
    } finally {
      await tApp.close();
      tDb.close();
    }
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/signup/no-such-token/verify' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 410 with "already used" for a token already verified', async () => {
    const token = await submitSignup('reused@example.test');
    await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    const res = await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    expect(res.statusCode).toBe(410);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('already');
  });

  it('returns 410 with "expired" for a token past its expiry', async () => {
    const token = await submitSignup('expired@example.test');
    db.prepare(`UPDATE signup_requests SET verification_expires_at = ? WHERE token = ?`).run(
      new Date(Date.now() - 1000).toISOString(),
      token,
    );
    const res = await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    expect(res.statusCode).toBe(410);
    const body = res.json<{ message: string }>();
    expect(body.message.toLowerCase()).toContain('expired');
  });
});

describe('GET /api/signup-requests', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 200 with array including status and submission date for admin', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'list@example.test', password: 'a-strong-passphrase-1' },
    });
    const token = create.json<{ token: string }>().token;
    await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });

    const res = await app.inject({
      method: 'GET',
      url: '/api/signup-requests',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<Array<{ email: string; status: string; createdAt: string }>>();
    expect(Array.isArray(body)).toBe(true);
    const entry = body.find((r) => r.email === 'list@example.test');
    expect(entry?.status).toBe('PENDING_REVIEW');
    expect(entry?.createdAt).toBeDefined();
  });

  it('returns 403 for a non-admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/signup-requests',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/signup-requests/:token/approve', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  async function submitAndVerify(email: string): Promise<string> {
    const create = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email, password: 'a-strong-passphrase-1' },
    });
    const token = create.json<{ token: string }>().token;
    await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    return token;
  }

  it('creates an active MEMBER user and sends the welcome email', async () => {
    let welcomeEmailTo: string | undefined;
    const trackingMailer: MailerService = {
      sendSignupVerificationEmail: async () => {},
      sendAdminSignupNotificationEmail: async () => {},
      sendWelcomeEmail: async (to: string) => {
        welcomeEmailTo = to;
      },
    } as unknown as MailerService;
    const { app: tApp, db: tDb, adminCookie: tAdmin } = await setup(trackingMailer);
    try {
      const create = await tApp.inject({
        method: 'POST',
        url: '/api/signup',
        payload: { email: 'approve@example.test', password: 'a-strong-passphrase-1' },
      });
      const token = create.json<{ token: string }>().token;
      await tApp.inject({ method: 'POST', url: `/api/signup/${token}/verify` });

      const res = await tApp.inject({
        method: 'POST',
        url: `/api/signup-requests/${token}/approve`,
        cookies: { [SESSION_COOKIE_NAME]: tAdmin },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json<{ id: string; email: string; role: string }>();
      expect(body.email).toBe('approve@example.test');
      expect(body.role).toBe('MEMBER');

      await new Promise((r) => setTimeout(r, 20));
      expect(welcomeEmailTo).toBe('approve@example.test');

      const list = await tApp.inject({
        method: 'GET',
        url: '/api/signup-requests',
        cookies: { [SESSION_COOKIE_NAME]: tAdmin },
      });
      const remaining = list.json<Array<{ email: string }>>();
      expect(remaining.some((r) => r.email === 'approve@example.test')).toBe(false);
    } finally {
      await tApp.close();
      tDb.close();
    }
  });

  it('the newly approved user can sign in with their originally chosen password', async () => {
    const token = await submitAndVerify('signin@example.test');
    await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/approve`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in',
      payload: { email: 'signin@example.test', password: 'a-strong-passphrase-1' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 for a non-admin', async () => {
    const token = await submitAndVerify('forbidden@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/approve`,
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup-requests/no-such-token/approve',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 when the request is still UNVERIFIED', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'unverified@example.test', password: 'a-strong-passphrase-1' },
    });
    const token = create.json<{ token: string }>().token;
    const res = await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/approve`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/signup-requests/:token/reject', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  async function submitAndVerify(email: string): Promise<string> {
    const create = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email, password: 'a-strong-passphrase-1' },
    });
    const token = create.json<{ token: string }>().token;
    await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    return token;
  }

  it('rejects with a reason and sends a rejection email', async () => {
    let rejectedReason: string | undefined;
    const trackingMailer: MailerService = {
      sendSignupVerificationEmail: async () => {},
      sendAdminSignupNotificationEmail: async () => {},
      sendSignupRejectionEmail: async (_to: string, reason: string | undefined) => {
        rejectedReason = reason;
      },
    } as unknown as MailerService;
    const { app: tApp, db: tDb, adminCookie: tAdmin } = await setup(trackingMailer);
    try {
      const create = await tApp.inject({
        method: 'POST',
        url: '/api/signup',
        payload: { email: 'reject@example.test', password: 'a-strong-passphrase-1' },
      });
      const token = create.json<{ token: string }>().token;
      await tApp.inject({ method: 'POST', url: `/api/signup/${token}/verify` });

      const res = await tApp.inject({
        method: 'POST',
        url: `/api/signup-requests/${token}/reject`,
        payload: { reason: 'Could not verify identity' },
        cookies: { [SESSION_COOKIE_NAME]: tAdmin },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ status: string; rejectionReason: string }>();
      expect(body.status).toBe('REJECTED');
      expect(body.rejectionReason).toBe('Could not verify identity');

      await new Promise((r) => setTimeout(r, 20));
      expect(rejectedReason).toBe('Could not verify identity');
    } finally {
      await tApp.close();
      tDb.close();
    }
  });

  it('rejects without a reason', async () => {
    const token = await submitAndVerify('rejectnoreason@example.test');
    const res = await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/reject`,
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it('blocks resubmission of the rejected email (409)', async () => {
    const token = await submitAndVerify('blocked@example.test');
    await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/reject`,
      payload: { reason: 'no' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'blocked@example.test', password: 'another-passphrase-1' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/signup-requests/no-such-token/reject',
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns 409 for a concurrent double-decision (already rejected)', async () => {
    const token = await submitAndVerify('doubledecision@example.test');
    await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/reject`,
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    const res = await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/reject`,
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('DELETE /api/signup-requests/:token', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;

  beforeEach(async () => {
    ({ db, app, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('deletes a rejected entry and clears the blacklist', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'freed@example.test', password: 'a-strong-passphrase-1' },
    });
    const token = create.json<{ token: string }>().token;
    await app.inject({ method: 'POST', url: `/api/signup/${token}/verify` });
    await app.inject({
      method: 'POST',
      url: `/api/signup-requests/${token}/reject`,
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/signup-requests/${token}`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(del.statusCode).toBe(204);

    const res = await app.inject({
      method: 'POST',
      url: '/api/signup',
      payload: { email: 'freed@example.test', password: 'try-again-1' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/signup-requests/${randomUUID()}`,
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(404);
  });
});
