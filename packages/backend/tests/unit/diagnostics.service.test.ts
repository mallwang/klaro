import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { FastifyRequest } from 'fastify';

/**
 * Unit tests for individual diagnostics check functions in diagnostics.service.ts.
 */

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
    readFileSync: vi.fn(actual.readFileSync),
  };
});

vi.mock('node:https', () => ({
  default: { request: vi.fn() },
  request: vi.fn(),
}));

vi.mock('node:dns/promises', () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

import { existsSync, readFileSync } from 'node:fs';
import * as https from 'node:https';
import * as dnsPromises from 'node:dns/promises';
import {
  runCheck,
  checkDbVersion,
  checkContainerized,
  checkReverseProxy,
  checkDomainMatch,
  checkHttps,
  checkInternetAccess,
  checkDnsResolution,
  checkClockDrift,
  checkSmtpHost,
  checkSmtpPort,
  checkSmtpFrom,
  checkSmtpFromName,
  checkLogoDevConfigured,
} from '../../src/services/diagnostics.service.js';

describe('runCheck', () => {
  it('resolves the wrapped promise result when it completes in time', async () => {
    const result = await runCheck(async () => ({ status: 'ok', detail: 'fine' }), 100);
    expect(result).toEqual({ status: 'ok', detail: 'fine' });
  });

  it('resolves to a timed-out result when the check exceeds the timeout', async () => {
    const result = await runCheck(
      () => new Promise((resolve) => setTimeout(() => resolve({ status: 'ok', detail: 'x' }), 200)),
      20,
    );
    expect(result.status).toBe('timed-out');
  });

  it('resolves to a failed result rather than rejecting when the check throws', async () => {
    const result = await runCheck(async () => {
      throw new Error('boom');
    }, 100);
    expect(result.status).toBe('failed');
    expect(result.detail).toContain('boom');
  });
});

describe('checkDbVersion', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('returns ok with the sqlite version string', async () => {
    const result = await checkDbVersion(db);
    expect(result.status).toBe('ok');
    expect(result.detail).toMatch(/^\d+\.\d+/);
  });

  it('returns failed when the query throws', async () => {
    const brokenDb = {
      prepare: () => ({
        get: () => {
          throw new Error('db down');
        },
      }),
    } as unknown as Database.Database;
    const result = await checkDbVersion(brokenDb);
    expect(result.status).toBe('failed');
  });
});

describe('checkContainerized', () => {
  it('returns ok/true when /.dockerenv exists', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const result = checkContainerized();
    expect(result).toEqual({ status: 'ok', detail: 'true' });
  });

  it('returns ok/true when /proc/1/cgroup mentions docker or kubepods', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockReturnValue('1:name=systemd:/docker/abc123' as unknown as Buffer);
    const result = checkContainerized();
    expect(result).toEqual({ status: 'ok', detail: 'true' });
  });

  it('returns ok/false on read error (e.g. non-Linux host)', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const result = checkContainerized();
    expect(result).toEqual({ status: 'ok', detail: 'false' });
  });
});

describe('checkReverseProxy', () => {
  it('reports "not detected" when no forwarded headers are present', () => {
    const result = checkReverseProxy({});
    expect(result.detail).toBe('not detected');
  });

  it('detects x-forwarded-for', () => {
    const result = checkReverseProxy({ 'x-forwarded-for': '1.2.3.4' });
    expect(result.detail).toBe('x-forwarded-for');
  });

  it('detects x-real-ip', () => {
    const result = checkReverseProxy({ 'x-real-ip': '1.2.3.4' });
    expect(result.detail).toBe('x-real-ip');
  });
});

describe('checkDomainMatch', () => {
  it('returns ok when configured and observed hosts match', () => {
    const result = checkDomainMatch('https://app.example.com', 'app.example.com');
    expect(result.status).toBe('ok');
    expect(result.detail).toContain('app.example.com');
  });

  it('returns warning when configured and observed hosts differ, with both values in detail', () => {
    const result = checkDomainMatch('https://app.example.com', 'other.example.com');
    expect(result.status).toBe('warning');
    expect(result.detail).toContain('app.example.com');
    expect(result.detail).toContain('other.example.com');
  });
});

describe('checkHttps', () => {
  it('reports true when x-forwarded-proto is https', () => {
    const request = {
      headers: { 'x-forwarded-proto': 'https' },
      protocol: 'http',
    } as unknown as FastifyRequest;
    expect(checkHttps(request).detail).toBe('true');
  });

  it('reports true when request.protocol is https', () => {
    const request = { headers: {}, protocol: 'https' } as unknown as FastifyRequest;
    expect(checkHttps(request).detail).toBe('true');
  });

  it('reports false otherwise', () => {
    const request = { headers: {}, protocol: 'http' } as unknown as FastifyRequest;
    expect(checkHttps(request).detail).toBe('false');
  });
});

describe('checkInternetAccess', () => {
  it('returns ok/reachable and the Date header on a successful HEAD request', async () => {
    vi.mocked(https.request).mockImplementation(((_opts: unknown, cb: (res: unknown) => void) => {
      const res = { headers: { date: 'Mon, 01 Jan 2026 00:00:00 GMT' }, resume: vi.fn() };
      cb(res);
      return { on: vi.fn(), end: vi.fn() };
    }) as unknown as typeof https.request);
    const outcome = await checkInternetAccess(1000);
    expect(outcome.result.status).toBe('ok');
    expect(outcome.dateHeader).toBe('Mon, 01 Jan 2026 00:00:00 GMT');
  });

  it('returns failed when the request errors', async () => {
    vi.mocked(https.request).mockImplementation((() => {
      return {
        on: (event: string, cb: (err: Error) => void) => {
          if (event === 'error') cb(new Error('network down'));
        },
        end: vi.fn(),
      };
    }) as unknown as typeof https.request);
    const outcome = await checkInternetAccess(1000);
    expect(outcome.result.status).toBe('failed');
    expect(outcome.dateHeader).toBeNull();
  });

  it('returns timed-out when the request takes too long', async () => {
    vi.mocked(https.request).mockImplementation((() => {
      return { on: vi.fn(), end: vi.fn() };
    }) as unknown as typeof https.request);
    const outcome = await checkInternetAccess(20);
    expect(outcome.result.status).toBe('timed-out');
  });
});

describe('checkDnsResolution', () => {
  it('returns ok with the resolved IP on success', async () => {
    vi.mocked(dnsPromises.lookup).mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const result = await checkDnsResolution(1000);
    expect(result).toEqual({ status: 'ok', detail: '93.184.216.34' });
  });

  it('returns failed on lookup error', async () => {
    vi.mocked(dnsPromises.lookup).mockRejectedValue(new Error('ENOTFOUND'));
    const result = await checkDnsResolution(1000);
    expect(result.status).toBe('failed');
  });
});

describe('checkClockDrift', () => {
  it('returns ok when drift is within the threshold', () => {
    const now = new Date();
    const result = checkClockDrift(now.toUTCString(), 5000);
    expect(result.status).toBe('ok');
  });

  it('returns warning when drift exceeds the threshold', () => {
    const past = new Date(Date.now() - 60_000);
    const result = checkClockDrift(past.toUTCString(), 5000);
    expect(result.status).toBe('warning');
  });

  it('returns failed when no remote date header is available', () => {
    const result = checkClockDrift(null, 5000);
    expect(result.status).toBe('failed');
  });
});

describe('checkSmtpHost', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok with the configured host', () => {
    vi.stubEnv('SMTP_HOST', 'email-smtp.eu-west-1.amazonaws.com');
    expect(checkSmtpHost()).toEqual({ status: 'ok', detail: 'email-smtp.eu-west-1.amazonaws.com' });
  });

  it('returns warning/not set when SMTP_HOST is unset', () => {
    vi.stubEnv('SMTP_HOST', '');
    expect(checkSmtpHost()).toEqual({ status: 'warning', detail: 'not set' });
  });
});

describe('checkSmtpPort', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the configured port', () => {
    vi.stubEnv('SMTP_PORT', '465');
    expect(checkSmtpPort()).toEqual({ status: 'ok', detail: '465' });
  });

  it('defaults to 587 when SMTP_PORT is unset', () => {
    vi.stubEnv('SMTP_PORT', '');
    expect(checkSmtpPort()).toEqual({ status: 'ok', detail: '587' });
  });
});

describe('checkSmtpFrom', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok with the configured from address', () => {
    vi.stubEnv('SMTP_FROM', 'noreply@example.test');
    expect(checkSmtpFrom()).toEqual({ status: 'ok', detail: 'noreply@example.test' });
  });

  it('returns warning/not set when SMTP_FROM is unset', () => {
    vi.stubEnv('SMTP_FROM', '');
    expect(checkSmtpFrom()).toEqual({ status: 'warning', detail: 'not set' });
  });
});

describe('checkSmtpFromName', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok with the configured from name', () => {
    vi.stubEnv('SMTP_FROM_NAME', 'Klaro');
    expect(checkSmtpFromName()).toEqual({ status: 'ok', detail: 'Klaro' });
  });

  it('returns ok/not set when SMTP_FROM_NAME is unset (optional field)', () => {
    vi.stubEnv('SMTP_FROM_NAME', '');
    expect(checkSmtpFromName()).toEqual({ status: 'ok', detail: 'not set' });
  });
});

describe('checkLogoDevConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns ok/configured when LOGO_DEV_TOKEN is set', () => {
    vi.stubEnv('LOGO_DEV_TOKEN', 'pk_test_token');
    expect(checkLogoDevConfigured()).toEqual({ status: 'ok', detail: 'configured' });
  });

  it('returns warning/not configured when LOGO_DEV_TOKEN is unset', () => {
    vi.stubEnv('LOGO_DEV_TOKEN', '');
    expect(checkLogoDevConfigured()).toEqual({ status: 'warning', detail: 'not configured' });
  });
});
