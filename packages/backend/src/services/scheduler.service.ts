import cron, { type ScheduledTask } from 'node-cron';
import type { NotificationService } from './notification.service.js';

/**
 * Registers and manages the node-cron jobs for maintenance and email dispatch.
 *
 * Always registers a daily invitation-purge job at 03:00 UTC. Registers weekly
 * and monthly summary-email jobs only when a NotificationService is provided.
 */

export class SchedulerService {
  private tasks: ScheduledTask[] = [];

  /**
   * Creates a SchedulerService instance.
   *
   * @param purge - Function that deletes stale invitation rows; called daily at 03:00 UTC
   * @param notification - Optional notification service; when provided, registers the
   *   summary-email cron jobs (weekly on Monday and monthly on the 1st at 10:00 UTC)
   */
  constructor(
    private readonly purge: () => void,
    private readonly notification?: NotificationService,
  ) {}

  /**
   * Registers all cron jobs and starts them immediately.
   *
   * The purge job runs unconditionally; email jobs run only when a notification
   * service was supplied to the constructor.
   */
  start(): void {
    const jobs: ScheduledTask[] = [
      cron.schedule('0 3 * * *', () => this.purge(), { timezone: 'UTC' }),
    ];

    if (this.notification) {
      jobs.push(
        cron.schedule('0 10 * * 1', () => void this.notification!.sendSummaryEmails('WEEKLY'), {
          timezone: 'UTC',
        }),
        cron.schedule('0 10 1 * *', () => void this.notification!.sendSummaryEmails('MONTHLY'), {
          timezone: 'UTC',
        }),
      );
    }

    this.tasks.push(...jobs);
  }

  /**
   * Stops all registered cron jobs. Primarily used in tests to avoid open handles.
   */
  stop(): void {
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
  }
}
