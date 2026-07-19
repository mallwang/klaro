import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { DiagnosticsReportSchema } from '@pcm/shared';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';

let hangHttpsRequests = false;

vi.mock('node:https', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:https')>();
  return {
    ...actual,
    request: ((...args: Parameters<typeof actual.request>) => {
      if (hangHttpsRequests) {
        return { on: () => {}, end: () => {} } as unknown as ReturnType<typeof actual.request>;
      }
      return actual.request(...args);
    }) as typeof actual.request,
  };
});

/**
 * Integration tests for the admin diagnostics endpoints: auth gating, response shape, and
 * failure isolation for slow/hanging external checks.
 */

async function setup() {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db);
  await app.ready();
  const admin = createAuthenticatedSession(db, { role: 'ADMIN', email: 'admin@example.test' });
  const member = createAuthenticatedSession(db, { role: 'MEMBER', email: 'member@example.test' });
  return { db, app, adminCookie: admin.sessionId, memberCookie: member.sessionId };
}

describe('GET /api/admin/diagnostics', () => {
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

  it('returns 200 with a body matching DiagnosticsReportSchema for an admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/diagnostics',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const parsed = DiagnosticsReportSchema.safeParse(res.json());
    expect(parsed.success).toBe(true);
  }, 10_000);

  it('returns 403 for a non-admin user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/diagnostics',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/diagnostics' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /admin/diagnostics (no-JS HTML fallback)', () => {
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

  it('returns 200 text/html with Versions, System Checks, and Environment Variables sections for an admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/diagnostics',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('Versions');
    expect(res.body).toContain('System Checks');
    expect(res.body).toContain('Environment Variables');
    expect(res.body).not.toContain('<script>');
  }, 10_000);

  it('returns 403 for a non-admin user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/diagnostics',
      cookies: { [SESSION_COOKIE_NAME]: memberCookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/diagnostics' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/admin/diagnostics — failure isolation for a hanging external check', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let adminCookie: string;
  let originalTimeout: string | undefined;

  beforeEach(async () => {
    originalTimeout = process.env['DIAGNOSTICS_CHECK_TIMEOUT_MS'];
    process.env['DIAGNOSTICS_CHECK_TIMEOUT_MS'] = '200';
    hangHttpsRequests = true;
    ({ db, app, adminCookie } = await setup());
  });

  afterEach(async () => {
    await app.close();
    db.close();
    hangHttpsRequests = false;
    if (originalTimeout === undefined) delete process.env['DIAGNOSTICS_CHECK_TIMEOUT_MS'];
    else process.env['DIAGNOSTICS_CHECK_TIMEOUT_MS'] = originalTimeout;
  });

  it('still responds 200 within the timeout budget, marking the hung check timed-out', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/diagnostics',
      cookies: { [SESSION_COOKIE_NAME]: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<{
      versions: { appVersion: string };
      systemChecks: { internetAccess: { status: string } };
    }>();
    expect(body.systemChecks.internetAccess.status).toBe('timed-out');
    expect(body.versions.appVersion).toBeTruthy();
  }, 10_000);
});
