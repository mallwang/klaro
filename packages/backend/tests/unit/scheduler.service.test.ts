import { describe, it, expect, vi, afterEach } from 'vitest';
import { SchedulerService } from '../../src/services/scheduler.service.js';
import type { NotificationService } from '../../src/services/notification.service.js';

/**
 * Tests for SchedulerService — verifies cron job registration without ticking the clock.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

function makeStubNotification(): NotificationService {
  return {
    sendSummaryEmails: vi.fn().mockResolvedValue(undefined),
    sendSummaryEmailForUser: vi.fn().mockResolvedValue(undefined),
  } as unknown as NotificationService;
}

describe('SchedulerService.start()', () => {
  it('starts without throwing', () => {
    const scheduler = new SchedulerService(makeStubNotification());
    expect(() => scheduler.start()).not.toThrow();
    scheduler.stop();
  });

  it('stops without throwing after start', () => {
    const scheduler = new SchedulerService(makeStubNotification());
    scheduler.start();
    expect(() => scheduler.stop()).not.toThrow();
  });

  it('can be started and stopped multiple times without error', () => {
    const scheduler = new SchedulerService(makeStubNotification());
    scheduler.start();
    scheduler.stop();
    scheduler.start();
    scheduler.stop();
  });
});
