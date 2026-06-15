import type Database from 'better-sqlite3';
import type {
  DashboardResponse,
  CategorySummary,
  UpcomingRenewal,
  ExpiredContract,
} from '@pcm/shared';
import { CATEGORY_LABELS, type Category, type CancellationPeriodUnit } from '@pcm/shared';

/**
 * Service layer for dashboard aggregations: monthly spending totals, renewal alerts,
 * and expired contract detection.
 */

const GRACE_PERIOD_DAYS = 30;

/**
 * Calculates the cancellation deadline by subtracting the given notice period from the
 * end date using UTC arithmetic to avoid daylight-saving-time boundary shifts.
 *
 * @param endDate - The contract end date as a UTC Date
 * @param period - The cancellation notice period, or null if no period is configured
 * @returns A new Date representing the deadline by which the user must cancel
 */
export function computeCancellationDeadline(
  endDate: Date,
  period: { value: number; unit: CancellationPeriodUnit } | null,
): Date {
  if (!period) return new Date(endDate);
  const result = new Date(endDate);
  switch (period.unit) {
    case 'DAYS':
      result.setUTCDate(result.getUTCDate() - period.value);
      break;
    case 'WEEKS':
      result.setUTCDate(result.getUTCDate() - period.value * 7);
      break;
    case 'MONTHS':
      result.setUTCMonth(result.getUTCMonth() - period.value);
      break;
    case 'YEARS':
      result.setUTCFullYear(result.getUTCFullYear() - period.value);
      break;
  }
  return result;
}

/**
 * Formats a Date to a YYYY-MM-DD string using UTC components.
 *
 * @param d - The date to format
 * @returns An ISO 8601 date string in YYYY-MM-DD format
 */
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const MONTHLY_FACTOR_SQL = `
  amount * CASE billing_interval
    WHEN 'WEEKLY'    THEN 52.0/12.0
    WHEN 'MONTHLY'   THEN 1.0
    WHEN 'QUARTERLY' THEN 1.0/3.0
    WHEN 'YEARLY'    THEN 1.0/12.0
    ELSE 0.0
  END
`.trim();

export class DashboardService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Assembles and returns the complete dashboard payload for the given user.
   *
   * @param ownerId - The ID of the user whose dashboard data to compute
   * @returns The full DashboardResponse with spending, category breakdown, renewals, and
   *   expired contracts
   */
  getDashboardData(ownerId: string): DashboardResponse {
    const totalMonthlySpending = this.getTotalMonthlySpending(ownerId);
    const contractsByCategory = this.getContractsByCategory(ownerId);
    const upcomingRenewals = this.getUpcomingRenewals(ownerId);
    const expiredContracts = this.getExpiredContracts(ownerId);
    return { totalMonthlySpending, contractsByCategory, upcomingRenewals, expiredContracts };
  }

  /**
   * Computes the sum of normalised monthly costs for all active contracts owned by the user.
   *
   * @param ownerId - The ID of the user
   * @returns The total monthly spending amount
   */
  private getTotalMonthlySpending(ownerId: string): number {
    const row = this.db
      .prepare<[string], { total: number }>(
        `SELECT COALESCE(SUM(${MONTHLY_FACTOR_SQL}), 0) AS total
         FROM contracts
         WHERE status = 'ACTIVE' AND user_id = ?`,
      )
      .get(ownerId);
    return row?.total ?? 0;
  }

  /**
   * Groups active contracts by category and returns per-category spending totals and counts.
   *
   * @param ownerId - The ID of the user
   * @returns An array of CategorySummary objects sorted by monthly total descending
   */
  private getContractsByCategory(ownerId: string): CategorySummary[] {
    const rows = this.db
      .prepare<[string], { category: string; count: number; monthly_total: number }>(
        `SELECT category,
                COUNT(*) AS count,
                SUM(${MONTHLY_FACTOR_SQL}) AS monthly_total
         FROM contracts
         WHERE status = 'ACTIVE' AND user_id = ?
         GROUP BY category
         ORDER BY monthly_total DESC`,
      )
      .all(ownerId);

    return rows.map((row) => ({
      category: row.category as Category,
      label: CATEGORY_LABELS[row.category as Category] ?? row.category,
      count: row.count,
      monthlyTotal: row.monthly_total,
    }));
  }

  /**
   * Returns non-lifetime contracts whose cancellation deadline falls within the upcoming
   * grace-period window, sorted by deadline ascending then name.
   *
   * @param ownerId - The ID of the user
   * @returns An array of UpcomingRenewal objects for contracts requiring attention
   *
   * Date-only strings are parsed as UTC midnight to avoid local-timezone boundary shifts
   * when computing the number of days until the cancellation deadline.
   */
  private getUpcomingRenewals(ownerId: string): UpcomingRenewal[] {
    const rows = this.db
      .prepare<
        [string],
        {
          id: string;
          name: string;
          category: string;
          end_date: string;
          cancellation_period_value: number | null;
          cancellation_period_unit: string | null;
          anonymize: number;
        }
      >(
        `SELECT id, name, category, end_date,
                cancellation_period_value, cancellation_period_unit, anonymize
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date >= DATE('now')
           AND user_id = ?`,
      )
      .all(ownerId);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const results: UpcomingRenewal[] = [];

    for (const row of rows) {
      // Parse date-only strings as UTC midnight to avoid local-timezone shifts
      const endDate = new Date(row.end_date + 'T00:00:00Z');

      const period =
        row.cancellation_period_value !== null && row.cancellation_period_unit !== null
          ? {
              value: row.cancellation_period_value,
              unit: row.cancellation_period_unit as CancellationPeriodUnit,
            }
          : null;

      const cancellationDeadline = computeCancellationDeadline(endDate, period);

      const panelEntryDate = new Date(cancellationDeadline);
      panelEntryDate.setUTCDate(panelEntryDate.getUTCDate() - GRACE_PERIOD_DAYS);

      if (today < panelEntryDate) continue;

      const daysUntilCancellationDeadline = Math.round(
        (cancellationDeadline.getTime() - today.getTime()) / 86_400_000,
      );

      results.push({
        id: row.id,
        name: row.name,
        category: row.category as Category,
        endDate: row.end_date,
        cancellationDeadline: toDateString(cancellationDeadline),
        daysUntilCancellationDeadline,
        anonymize: row.anonymize !== 0,
      });
    }

    results.sort((a, b) => {
      if (a.daysUntilCancellationDeadline !== b.daysUntilCancellationDeadline) {
        return a.daysUntilCancellationDeadline - b.daysUntilCancellationDeadline;
      }
      return a.name.localeCompare(b.name);
    });

    return results;
  }

  /**
   * Returns non-lifetime contracts whose end date has passed, sorted by end date descending.
   *
   * @param ownerId - The ID of the user
   * @returns An array of ExpiredContract objects with the number of days overdue
   */
  private getExpiredContracts(ownerId: string): ExpiredContract[] {
    const rows = this.db
      .prepare<
        [string],
        { id: string; name: string; category: string; end_date: string; anonymize: number }
      >(
        `SELECT id, name, category, end_date, anonymize
         FROM contracts
         WHERE end_date IS NOT NULL
           AND billing_interval != 'LIFETIME'
           AND end_date < DATE('now')
           AND user_id = ?
         ORDER BY end_date DESC`,
      )
      .all(ownerId);

    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    return rows.map((row) => {
      const [y, m, d] = row.end_date.split('-').map(Number) as [number, number, number];
      const endUtc = Date.UTC(y, m - 1, d);
      const daysOverdue = Math.round((todayUtc - endUtc) / 86_400_000);
      return {
        id: row.id,
        name: row.name,
        category: row.category as Category,
        endDate: row.end_date,
        daysOverdue,
        anonymize: row.anonymize !== 0,
      };
    });
  }
}
