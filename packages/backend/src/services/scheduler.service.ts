import cron, { type ScheduledTask } from 'node-cron';
import type { NotificationService } from './notification.service.js';

/**
 * Registers and manages the two node-cron jobs that trigger summary email dispatch at
 * 10:00 UTC every Monday (weekly cohort) and 10:00 UTC on the 1st of each month (monthly cohort).
 */

export class SchedulerService {
  private tasks: ScheduledTask[] = [];

  constructor(private readonly notification: NotificationService) {}

  /**
   * Registers the weekly and monthly cron jobs and starts them immediately.
   *
   * @returns void
   *
   * Jobs run only when the SMTP mailer is available — that guard is enforced by the caller
   * in the server entry point rather than here, keeping the scheduler itself simple.
   */
  start(): void {
    this.tasks.push(
      cron.schedule('0 10 * * 1', () => void this.notification.sendSummaryEmails('WEEKLY'), {
        timezone: 'UTC',
      }),
    );
    this.tasks.push(
      cron.schedule('0 10 1 * *', () => void this.notification.sendSummaryEmails('MONTHLY'), {
        timezone: 'UTC',
      }),
    );
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
