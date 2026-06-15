import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';
import type { MailerService } from '../../src/services/mailer.service.js';

/**
 * Integration tests for GET/PATCH /api/profile/notification-preferences.
 */

function makeStubMailer(): MailerService {
  return {
    sendInvitationEmail: async () => {},
    sendEmailVerificationEmail: async () => {},
    sendEmailChangeConfirmationEmail: async () => {},
  } as unknown as MailerService;
}

async function setup() {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db, { mailer: makeStubMailer() });
  await app.ready();
  const member = createAuthenticatedSession(db, {
    role: 'MEMBER',
    email: 'member@example.test',
    displayName: 'Member',
  });
  return { db, app, memberCookie: member.sessionId, memberId: member.userId };
}

describe('GET /api/profile/notification-preferences', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns the default disabled state for a new user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      summaryEmailEnabled: boolean;
      summaryEmailFrequency: string | null;
      nextSendAt: string | null;
    }>();
    expect(body.summaryEmailEnabled).toBe(false);
    expect(body.summaryEmailFrequency).toBeNull();
    expect(body.nextSendAt).toBeNull();
  });

  it('returns 401 without an authenticated session', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('PATCH /api/profile/notification-preferences', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns 204 and persists enabled=true + WEEKLY, then GET returns updated values with nextSendAt', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: true, summaryEmailFrequency: 'WEEKLY' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(patch.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(get.statusCode).toBe(200);
    const body = get.json<{
      summaryEmailEnabled: boolean;
      summaryEmailFrequency: string;
      nextSendAt: string;
    }>();
    expect(body.summaryEmailEnabled).toBe(true);
    expect(body.summaryEmailFrequency).toBe('WEEKLY');
    expect(body.nextSendAt).toMatch(/^\d{4}-\d{2}-\d{2}T10:00:00\.000Z$/);
  });

  it('returns 204 and persists MONTHLY, GET returns nextSendAt on the 1st', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: true, summaryEmailFrequency: 'MONTHLY' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(patch.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    const body = get.json<{ nextSendAt: string }>();
    expect(body.nextSendAt).toMatch(/T10:00:00\.000Z$/);
    expect(new Date(body.nextSendAt).getUTCDate()).toBe(1);
  });

  it('returns 204 on disable, GET returns disabled state and nextSendAt=null', async () => {
    // First enable
    await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: true, summaryEmailFrequency: 'WEEKLY' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    // Then disable
    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: false },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(patch.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    const body = get.json<{
      summaryEmailEnabled: boolean;
      summaryEmailFrequency: null;
      nextSendAt: null;
    }>();
    expect(body.summaryEmailEnabled).toBe(false);
    expect(body.summaryEmailFrequency).toBeNull();
    expect(body.nextSendAt).toBeNull();
  });

  it('returns 400 for enabled=true without a frequency', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: true },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for an unknown frequency value', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: true, summaryEmailFrequency: 'DAILY' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without an authenticated session', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: false },
    });
    expect(res.statusCode).toBe(401);
  });

  it('persists emailLanguage "de" and GET returns it', async () => {
    const patch = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: false, emailLanguage: 'de' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(patch.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(get.statusCode).toBe(200);
    const body = get.json<{ emailLanguage: string }>();
    expect(body.emailLanguage).toBe('de');
  });

  it('returns 400 for an unknown emailLanguage value', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/profile/notification-preferences',
      payload: { summaryEmailEnabled: false, emailLanguage: 'it' },
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/profile/notification-preferences – emailLanguage default', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;

  beforeEach(async () => {
    ({ db, app, memberCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
  });

  it('returns emailLanguage "en" by default for a new user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/profile/notification-preferences',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ emailLanguage: string }>();
    expect(body.emailLanguage).toBe('en');
  });
});
