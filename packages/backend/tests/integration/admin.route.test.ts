import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';
import { MailerError } from '../../src/services/mailer.service.js';

function makeStubMailer(opts: { testEmailFails?: boolean } = {}): MailerService {
  return {
    sendInvitationEmail: async () => {},
    sendTestEmail: opts.testEmailFails
      ? async () => {
          throw new MailerError('SMTP error');
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
  const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
  const member = createAuthenticatedSession(db, { role: 'MEMBER', email: 'member@example.test' });
  return { db, app, adminCookie: admin.sessionId, memberCookie: member.sessionId };
}

describe('POST /api/admin/email/test', () => {
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

  it('returns 200 when the mailer succeeds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: { email: 'recipient@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ message: string }>();
    expect(body.message).toBeTruthy();
  });

  it('returns 400 for a missing email field', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: {},
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a malformed email address', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: { email: 'not-an-email' },
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: { email: 'recipient@example.test' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when unauthenticated', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: { email: 'recipient@example.test' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when unauthenticated (alias check)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/email/test',
      payload: { email: 'recipient@example.test' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 502 when the mailer fails', async () => {
    const {
      db: failDb,
      app: failApp,
      adminCookie: failAdmin,
    } = await setup(makeStubMailer({ testEmailFails: true }));
    try {
      const res = await failApp.inject({
        method: 'POST',
        url: '/api/admin/email/test',
        payload: { email: 'recipient@example.test' },
        cookies: { [SESSION_COOKIE_NAME]: failAdmin },
      });
      expect(res.statusCode).toBe(502);
    } finally {
      await failApp.close();
      failDb.close();
    }
  });
});

describe('DELETE /api/admin/logos/cache', () => {
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

  function seedCache(count: number) {
    const insert = db.prepare(
      `INSERT INTO logo_cache (name, data, content_type, cached_at) VALUES (?, ?, ?, ?)`,
    );
    for (let i = 0; i < count; i++) {
      insert.run(`provider-${i}`, Buffer.from([0x00]), 'image/png', Date.now());
    }
  }

  it('returns { deleted: N } and clears the cache for an admin', async () => {
    seedCache(3);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/logos/cache',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ deleted: number }>().deleted).toBe(3);

    const remaining = db.prepare(`SELECT COUNT(*) AS n FROM logo_cache`).get() as { n: number };
    expect(remaining.n).toBe(0);
  });

  it('returns { deleted: 0 } when the cache is already empty', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/logos/cache',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ deleted: number }>().deleted).toBe(0);
  });

  it('returns 403 for a non-admin user', async () => {
    seedCache(1);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/logos/cache',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });

    expect(res.statusCode).toBe(403);
    const remaining = db.prepare(`SELECT COUNT(*) AS n FROM logo_cache`).get() as { n: number };
    expect(remaining.n).toBe(1);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/admin/logos/cache',
    });

    expect(res.statusCode).toBe(401);
  });
});
