import type Database from 'better-sqlite3';
import type {
  EmailSummaryFrequency,
  SummaryEmailData,
  SummaryExpiredRow,
  CtaState,
  CancellationPeriodUnit,
} from '@pcm/shared';
import type { MailerService } from './mailer.service.js';
import { computeCancellationDeadline } from './dashboard.js';

/**
 * Service for building and dispatching summary emails to opted-in users, and a pure utility
 * for computing the next scheduled send datetime.
 */

const MONTHLY_FACTOR_SQL = `
  amount * CASE billing_interval
    WHEN 'WEEKLY'    THEN 52.0/12.0
    WHEN 'MONTHLY'   THEN 1.0
    WHEN 'QUARTERLY' THEN 1.0/3.0
    WHEN 'YEARLY'    THEN 1.0/12.0
    ELSE 0.0
  END
`.trim();

/**
 * Computes the next UTC datetime at which a summary email should be sent for the given
 * frequency.
 *
 * @param frequency - 'WEEKLY' (next Monday) or 'MONTHLY' (next 1st of month)
 * @param now - Reference datetime; defaults to the current UTC time
 * @returns ISO 8601 UTC datetime string with time fixed at 10:00:00.000Z
 *
 * For WEEKLY: if today is Monday and the current UTC hour is before 10, the result is today
 * at 10:00:00 UTC; otherwise it is the next Monday at 10:00:00 UTC.
 * For MONTHLY: if today is the 1st and the current UTC hour is before 10, the result is
 * today at 10:00:00 UTC; otherwise it is the 1st of the next month at 10:00:00 UTC. The
 * December → January year boundary is handled correctly.
 */
export function computeNextSendAt(
  frequency: EmailSummaryFrequency,
  now: Date = new Date(),
): string {
  const result = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );

  if (frequency === 'WEEKLY') {
    const dow = result.getUTCDay(); // 0=Sun, 1=Mon…6=Sat
    const isMonday = dow === 1;
    const beforeSend = now.getUTCHours() < 10;

    if (isMonday && beforeSend) {
      // Use today
    } else {
      // Advance to next Monday
      const daysToAdd = dow === 0 ? 1 : 8 - dow;
      result.setUTCDate(result.getUTCDate() + daysToAdd);
    }
  } else {
    const isFirst = result.getUTCDate() === 1;
    const beforeSend = now.getUTCHours() < 10;

    if (isFirst && beforeSend) {
      // Use today
    } else {
      // Advance to 1st of next month
      result.setUTCMonth(result.getUTCMonth() + 1, 1);
    }
  }

  result.setUTCHours(10, 0, 0, 0);
  return result.toISOString();
}

interface UserSummaryRow {
  id: string;
  email: string;
  display_name: string;
  summary_email_frequency: string;
}

interface ContractDbRow {
  name: string;
  billing_interval: string;
  monthly_cost: number;
  anonymize: number;
}

interface RenewalDbRow {
  name: string;
  end_date: string;
  cancellation_period_value: number | null;
  cancellation_period_unit: string | null;
  anonymize: number;
}

interface ExpiredDbRow {
  name: string;
  end_date: string;
}

export class NotificationService {
  constructor(
    private readonly db: Database.Database,
    private readonly mailer: MailerService,
    private readonly appUrl: string,
  ) {}

  /**
   * Fetches all opted-in users for the given frequency and sends a summary email to each.
   * A per-user mailer failure is caught and logged so other users are still processed.
   *
   * @param frequency - Which cohort to send to: 'WEEKLY' or 'MONTHLY'
   */
  async sendSummaryEmails(frequency: EmailSummaryFrequency): Promise<void> {
    const users = this.db
      .prepare<[string], UserSummaryRow>(
        `SELECT id, email, display_name, summary_email_frequency
         FROM users
         WHERE summary_email_enabled = 1 AND summary_email_frequency = ? AND status = 'ACTIVE'`,
      )
      .all(frequency);

    for (const user of users) {
      try {
        await this.sendSummaryEmailForUser(user.id);
      } catch (err) {
        console.error({ err, userId: user.id }, 'Failed to send summary email');
      }
    }
  }

  /**
   * Builds and sends a summary email for a single user identified by their ID.
   * Public so callers can trigger a test send without waiting for a cron tick.
   *
   * @param userId - The ID of the user to send the summary email to
   */
  async sendSummaryEmailForUser(userId: string): Promise<void> {
    const user = this.db
      .prepare<
        [string],
        {
          email: string;
          display_name: string;
          summary_email_frequency: string | null;
        }
      >(
        `SELECT email, display_name, summary_email_frequency
         FROM users WHERE id = ?`,
      )
      .get(userId);

    if (!user) throw new Error(`User ${userId} not found`);

    const frequency = (user.summary_email_frequency ?? 'WEEKLY') as EmailSummaryFrequency;

    const contractRows = this.db
      .prepare<[string], ContractDbRow>(
        `SELECT name, billing_interval, (${MONTHLY_FACTOR_SQL}) AS monthly_cost, anonymize
         FROM contracts
         WHERE status = 'ACTIVE' AND user_id = ?`,
      )
      .all(userId);

    const totalMonthlySpending = contractRows.reduce((sum, r) => sum + r.monthly_cost, 0);

    const contracts = contractRows.map((r) => ({
      name: r.name,
      billingInterval: r.billing_interval,
      monthlyCost: r.monthly_cost,
      anonymize: r.anonymize !== 0,
    }));

    const renewalRows = this.db
      .prepare<[string], RenewalDbRow>(
        `SELECT name, end_date, cancellation_period_value, cancellation_period_unit, anonymize
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date >= DATE('now')
           AND user_id = ?`,
      )
      .all(userId);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const GRACE_PERIOD_DAYS = 30;

    const upcomingRenewals = renewalRows
      .flatMap((r) => {
        const endDate = new Date(r.end_date + 'T00:00:00Z');
        const period =
          r.cancellation_period_value !== null && r.cancellation_period_unit !== null
            ? {
                value: r.cancellation_period_value,
                unit: r.cancellation_period_unit as CancellationPeriodUnit,
              }
            : null;
        const cancellationDeadline = computeCancellationDeadline(endDate, period);
        const panelEntryDate = new Date(cancellationDeadline);
        panelEntryDate.setUTCDate(panelEntryDate.getUTCDate() - GRACE_PERIOD_DAYS);
        if (today < panelEntryDate) return [];
        const daysUntilDeadline = Math.round(
          (cancellationDeadline.getTime() - today.getTime()) / 86_400_000,
        );
        return [
          {
            name: r.name,
            endDate: r.end_date,
            cancellationDeadline: cancellationDeadline.toISOString().slice(0, 10),
            daysUntilDeadline,
            anonymize: r.anonymize !== 0,
          },
        ];
      })
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    const expiredRows = this.db
      .prepare<[string], ExpiredDbRow>(
        `SELECT name, end_date
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date < DATE('now')
           AND user_id = ?
         ORDER BY end_date DESC`,
      )
      .all(userId);

    const expiredContracts: SummaryExpiredRow[] = expiredRows.map((r) => {
      const endUtc = new Date(r.end_date + 'T00:00:00Z').getTime();
      const daysOverdue = Math.round((today.getTime() - endUtc) / 86_400_000);
      return { name: r.name, endDate: r.end_date, daysOverdue };
    });

    let ctaState: CtaState = 'none';
    if (contracts.length === 0) {
      ctaState = 'no-contracts';
    } else if (upcomingRenewals.length > 0) {
      ctaState = 'cancellation-due';
    }

    const data: SummaryEmailData = {
      userEmail: user.email,
      displayName: user.display_name,
      frequency,
      totalMonthlySpending,
      contracts,
      upcomingRenewals,
      expiredContracts,
      ctaState,
      dashboardUrl: this.appUrl,
    };

    await this.mailer.sendSummaryEmail(data);
  }
}
