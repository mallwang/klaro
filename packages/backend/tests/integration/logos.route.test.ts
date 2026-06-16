import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import type { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { buildServer, SESSION_COOKIE_NAME } from '../../src/server.js';
import { createAuthenticatedSession } from '../helpers/auth.js';

/**
 * Integration tests for the GET /api/logos proxy route and logo_cache behaviour.
 */

const FAKE_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes

async function setup() {
  const db = createDb(':memory:');
  runMigrations(db);
  db.prepare(`DELETE FROM users WHERE email = 'admin@localhost.local'`).run();
  const app = await buildServer(db, { logger: false });
  await app.ready();
  const member = createAuthenticatedSession(db, { role: 'MEMBER', email: 'member@example.test' });
  return { db, app, memberCookie: member.sessionId };
}

describe('GET /api/logos', () => {
  let db: Database.Database;
  let app: FastifyInstance;
  let memberCookie: string;
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(async () => {
    ({ db, app, memberCookie } = await setup());
    mockFetch = vi.spyOn(globalThis, 'fetch') as MockedFunction<typeof fetch>;
  });

  afterEach(async () => {
    await app.close();
    db.close();
    vi.restoreAllMocks();
  });

  it('returns 400 when name param is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/logos' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when name param is blank', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/logos?name=' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when name param is whitespace only', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/logos?name=%20' });
    expect(res.statusCode).toBe(400);
  });

  it('is accessible without authentication', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(FAKE_PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
    );
    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });
    expect(res.statusCode).toBe(200);
  });

  it('fetches from logo.dev on cache miss and returns binary image', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(FAKE_PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
    );

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(Buffer.from(res.rawPayload)).toEqual(FAKE_PNG);
  });

  it('sets Cache-Control header on successful response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(FAKE_PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
    );

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
  });

  it('stores successful response in logo_cache', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(FAKE_PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
    );

    await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });

    const row = db
      .prepare<
        [],
        { name: string; content_type: string }
      >(`SELECT name, content_type FROM logo_cache`)
      .get();
    expect(row).toBeTruthy();
    expect(row!.name).toBe('netflix');
    expect(row!.content_type).toBe('image/png');
  });

  it('returns 502 when logo.dev returns non-2xx', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=UnknownCo' });

    expect(res.statusCode).toBe(502);
  });

  it('does not cache non-2xx responses from logo.dev', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

    await app.inject({ method: 'GET', url: '/api/logos?name=UnknownCo' });

    const row = db
      .prepare<[], { name: string }>(`SELECT name FROM logo_cache WHERE name = 'unknownco'`)
      .get();
    expect(row).toBeUndefined();
  });

  it('returns 502 when logo.dev fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });

    expect(res.statusCode).toBe(502);
  });

  // US2: Cache hit behaviour
  it('serves from cache on second request without calling fetch', async () => {
    db.prepare(
      `INSERT INTO logo_cache (name, data, content_type, cached_at) VALUES (?, ?, ?, ?)`,
    ).run('spotify', FAKE_PNG, 'image/png', Date.now());

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Spotify' });

    expect(res.statusCode).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(Buffer.from(res.rawPayload)).toEqual(FAKE_PNG);
  });

  it('normalises name to lowercase for cache lookup', async () => {
    db.prepare(
      `INSERT INTO logo_cache (name, data, content_type, cached_at) VALUES (?, ?, ?, ?)`,
    ).run('netflix', FAKE_PNG, 'image/png', Date.now());

    const res = await app.inject({ method: 'GET', url: '/api/logos?name=Netflix' });

    expect(res.statusCode).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('normalises name to lowercase before inserting into cache', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(FAKE_PNG, { status: 200, headers: { 'content-type': 'image/png' } }),
    );

    await app.inject({ method: 'GET', url: '/api/logos?name=APPLE' });

    const row = db
      .prepare<[], { name: string }>(`SELECT name FROM logo_cache WHERE name = 'apple'`)
      .get();
    expect(row).toBeTruthy();
  });
});
