import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations } from '../../src/db/client.js';
import { DashboardService } from '../../src/services/dashboard.js';

function makeDb(): Database.Database {
  const db = createDb(':memory:');
  runMigrations(db);
  return db;
}

function insertContract(
  db: Database.Database,
  overrides: Partial<{
    id: string;
    name: string;
    category: string;
    amount: number;
    billing_interval: string;
    status: string;
    end_date: string | null;
    anonymize: number;
    cancellation_period_value: number | null;
    cancellation_period_unit: string | null;
  }> = {},
) {
  const row = {
    id: crypto.randomUUID(),
    name: 'Test Contract',
    category: 'SUBSCRIPTIONS',
    amount: 10.0,
    billing_interval: 'MONTHLY',
    status: 'ACTIVE',
    end_date: null,
    anonymize: 0,
    cancellation_period_value: null,
    cancellation_period_unit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  db.prepare(
    `INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, anonymize, cancellation_period_value, cancellation_period_unit, created_at, updated_at)
     VALUES (@id, @name, @category, @amount, @billing_interval, @status, @end_date, @anonymize, @cancellation_period_value, @cancellation_period_unit, @created_at, @updated_at)`,
  ).run(row);
  return row;
}

// ──────────────────────────────────────────────────────────────────────────────
// Total Monthly Spending
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – totalMonthlySpending', () => {
  let db: Database.Database;
  let service: DashboardService;

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns 0 when there are no contracts', () => {
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });

  it('sums MONTHLY amounts of active contracts only', () => {
    insertContract(db, { amount: 100, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 50, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    insertContract(db, { amount: 999, billing_interval: 'MONTHLY', status: 'INACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(150, 2);
  });

  it('normalizes WEEKLY amount to monthly equivalent (×52/12)', () => {
    // 12 per week × 52/12 = 52 per month
    insertContract(db, { amount: 12, billing_interval: 'WEEKLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(12 * (52 / 12), 2);
  });

  it('normalizes QUARTERLY amount to monthly equivalent (×1/3)', () => {
    // 30 per quarter = 10 per month
    insertContract(db, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('normalizes YEARLY amount to monthly equivalent (×1/12)', () => {
    // 120 per year = 10 per month
    insertContract(db, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(10, 2);
  });

  it('contributes 0 for LIFETIME contracts (excluded from recurring totals)', () => {
    insertContract(db, { amount: 999, billing_interval: 'LIFETIME', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });

  it('combines multiple intervals correctly', () => {
    // QUARTERLY €30 → €10/mo, YEARLY €120 → €10/mo, total = €20
    insertContract(db, { amount: 30, billing_interval: 'QUARTERLY', status: 'ACTIVE' });
    insertContract(db, { amount: 120, billing_interval: 'YEARLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBeCloseTo(20, 2);
  });

  it('treats a contract with amount 0 as zero contribution', () => {
    insertContract(db, { amount: 0, billing_interval: 'MONTHLY', status: 'ACTIVE' });
    const result = service.getDashboardData();
    expect(result.totalMonthlySpending).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Contracts by Category
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – contractsByCategory', () => {
  let db: Database.Database;
  let service: DashboardService;

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns empty array when there are no active contracts', () => {
    insertContract(db, { status: 'INACTIVE', category: 'HOUSING' });
    const result = service.getDashboardData();
    expect(result.contractsByCategory).toEqual([]);
  });

  it('groups active contracts by category with correct count and normalized total', () => {
    // 2 subscriptions: €10/mo + €30/quarter → €10+€10 = €20/mo
    insertContract(db, {
      category: 'SUBSCRIPTIONS',
      amount: 10,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'SUBSCRIPTIONS',
      amount: 30,
      billing_interval: 'QUARTERLY',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'HOUSING',
      amount: 1000,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'HOUSING',
      amount: 999,
      billing_interval: 'MONTHLY',
      status: 'INACTIVE',
    });
    const result = service.getDashboardData();
    const subs = result.contractsByCategory.find((c) => c.category === 'SUBSCRIPTIONS');
    const housing = result.contractsByCategory.find((c) => c.category === 'HOUSING');
    expect(subs).toBeDefined();
    expect(subs?.count).toBe(2);
    expect(subs?.monthlyTotal).toBeCloseTo(20, 2);
    expect(housing).toBeDefined();
    expect(housing?.count).toBe(1);
    expect(housing?.monthlyTotal).toBe(1000);
  });

  it('excludes LIFETIME contracts from category monthly totals', () => {
    insertContract(db, {
      category: 'OTHER',
      amount: 999,
      billing_interval: 'LIFETIME',
      status: 'ACTIVE',
    });
    insertContract(db, {
      category: 'OTHER',
      amount: 20,
      billing_interval: 'MONTHLY',
      status: 'ACTIVE',
    });
    const result = service.getDashboardData();
    const other = result.contractsByCategory.find((c) => c.category === 'OTHER');
    expect(other?.monthlyTotal).toBeCloseTo(20, 2);
    expect(other?.count).toBe(2);
  });

  it('excludes categories that have no active contracts', () => {
    insertContract(db, { category: 'OTHER', status: 'INACTIVE' });
    const result = service.getDashboardData();
    const other = result.contractsByCategory.find((c) => c.category === 'OTHER');
    expect(other).toBeUndefined();
  });

  it('includes the human-readable label for each category', () => {
    insertContract(db, {
      category: 'UTILITIES',
      status: 'ACTIVE',
      amount: 50,
      billing_interval: 'MONTHLY',
    });
    const result = service.getDashboardData();
    const utilities = result.contractsByCategory.find((c) => c.category === 'UTILITIES');
    expect(utilities?.label).toBe('Utilities');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Upcoming Renewals
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – upcomingRenewals', () => {
  let db: Database.Database;
  let service: DashboardService;

  function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function monthsFromNow(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }

  function yearsFromNow(years: number): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().slice(0, 10);
  }

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns empty array when no contracts have an end_date', () => {
    insertContract(db, { end_date: null });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toEqual([]);
  });

  it('returns empty array when no contracts are in the action window', () => {
    insertContract(db, { end_date: null });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });

  // no cancellation period: default 30-day window before end date
  it('includes a contract with no cancellation period when end_date is 20 days out', () => {
    insertContract(db, { name: 'NoPeriod', end_date: daysFromNow(20) });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    expect(result.upcomingRenewals[0]?.name).toBe('NoPeriod');
    // cancellationDeadline equals endDate when no period
    expect(result.upcomingRenewals[0]?.cancellationDeadline).toBe(daysFromNow(20));
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBe(20);
  });

  it('excludes a contract with no cancellation period when end_date is 40 days out', () => {
    insertContract(db, { name: 'NoPeriodFar', end_date: daysFromNow(40) });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });

  // cancellation period: 3 months
  it('includes a contract with 3-month cancellation when end_date is 4 months out', () => {
    insertContract(db, {
      name: '3mo-4mo',
      end_date: monthsFromNow(4),
      cancellation_period_value: 3,
      cancellation_period_unit: 'MONTHS',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    expect(result.upcomingRenewals[0]?.name).toBe('3mo-4mo');
    // daysUntilCancellationDeadline ≈ 30 (1 month before cancellationDeadline which is 1 month out)
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeGreaterThanOrEqual(25);
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThanOrEqual(35);
  });

  it('excludes a contract with 3-month cancellation when end_date is 6 months out', () => {
    insertContract(db, {
      name: '3mo-6mo',
      end_date: monthsFromNow(6),
      cancellation_period_value: 3,
      cancellation_period_unit: 'MONTHS',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });

  // edge: 14-day cancellation, end date 44 days out → entry date ≈ 0 days (today), included
  it('includes a contract with 14-day cancellation when end_date is 44 days out', () => {
    insertContract(db, {
      name: '14d-44d',
      end_date: daysFromNow(44),
      cancellation_period_value: 14,
      cancellation_period_unit: 'DAYS',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    // cancellationDeadline ≈ 30 days out; daysUntilCancellationDeadline ≈ 30
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeGreaterThanOrEqual(28);
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThanOrEqual(32);
  });

  // overdue: cancellation deadline in the past but end_date in the future
  it('includes a contract whose cancellation deadline has passed (overdue)', () => {
    insertContract(db, {
      name: 'Overdue',
      end_date: monthsFromNow(2),
      cancellation_period_value: 3,
      cancellation_period_unit: 'MONTHS',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    expect(result.upcomingRenewals[0]?.name).toBe('Overdue');
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThan(0);
  });

  // YEARS unit
  it('includes a contract with 1-year cancellation when end_date is 13 months out', () => {
    insertContract(db, {
      name: '1yr-13mo',
      end_date: monthsFromNow(13),
      cancellation_period_value: 1,
      cancellation_period_unit: 'YEARS',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
    // cancellationDeadline ≈ 1 month from now; entry date ≈ today
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeGreaterThanOrEqual(25);
    expect(result.upcomingRenewals[0]?.daysUntilCancellationDeadline).toBeLessThanOrEqual(35);
  });

  // sorting
  it('sorts by daysUntilCancellationDeadline ascending (most urgent first), then by name', () => {
    insertContract(db, {
      name: 'Urgent',
      end_date: daysFromNow(10),
      cancellation_period_value: null,
      cancellation_period_unit: null,
    });
    insertContract(db, {
      name: 'Less Urgent',
      end_date: daysFromNow(25),
      cancellation_period_value: null,
      cancellation_period_unit: null,
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.name).toBe('Urgent');
    expect(result.upcomingRenewals[1]?.name).toBe('Less Urgent');
  });

  it('uses name as tiebreaker when daysUntilCancellationDeadline is equal', () => {
    const sameDate = daysFromNow(15);
    insertContract(db, { name: 'Zebra', end_date: sameDate });
    insertContract(db, { name: 'Alpha', end_date: sameDate });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.name).toBe('Alpha');
    expect(result.upcomingRenewals[1]?.name).toBe('Zebra');
  });

  // exclusions
  it('excludes LIFETIME contracts even with an imminent end_date', () => {
    insertContract(db, {
      name: 'Lifetime Soon',
      billing_interval: 'LIFETIME',
      end_date: daysFromNow(7),
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });

  it('excludes contracts whose end_date has already passed', () => {
    insertContract(db, { name: 'Ended', end_date: daysFromNow(-1) });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(0);
  });

  it('includes contract regardless of status when in the action window', () => {
    insertContract(db, {
      name: 'Inactive But Soon',
      end_date: daysFromNow(10),
      status: 'INACTIVE',
    });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals).toHaveLength(1);
  });

  it('returns cancellationDeadline and endDate as ISO date strings', () => {
    const endDate = daysFromNow(20);
    insertContract(db, { name: 'Fields', end_date: endDate });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.endDate).toBe(endDate);
    expect(result.upcomingRenewals[0]?.cancellationDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maps anonymize column to boolean false on upcoming renewals', () => {
    insertContract(db, { name: 'Public', end_date: daysFromNow(20), anonymize: 0 });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.anonymize).toBe(false);
  });

  it('maps anonymize column to boolean true on upcoming renewals', () => {
    insertContract(db, { name: 'Private', end_date: daysFromNow(20), anonymize: 1 });
    const result = service.getDashboardData();
    expect(result.upcomingRenewals[0]?.anonymize).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Expired Contracts
// ──────────────────────────────────────────────────────────────────────────────

describe('DashboardService – expiredContracts', () => {
  let db: Database.Database;
  let service: DashboardService;

  function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  beforeEach(() => {
    db = makeDb();
    service = new DashboardService(db);
  });

  it('returns empty array when no contracts have a past end_date', () => {
    insertContract(db, { end_date: null });
    insertContract(db, { end_date: daysFromNow(10) });
    const result = service.getDashboardData();
    expect(result.expiredContracts).toEqual([]);
  });

  it('returns contracts whose end_date is strictly before today', () => {
    insertContract(db, { name: 'Expired', end_date: daysAgo(5) });
    insertContract(db, { name: 'Future', end_date: daysFromNow(5) });
    const result = service.getDashboardData();
    expect(result.expiredContracts).toHaveLength(1);
    expect(result.expiredContracts[0]?.name).toBe('Expired');
  });

  it('excludes contracts with null end_date', () => {
    insertContract(db, { name: 'NoDate', end_date: null });
    const result = service.getDashboardData();
    expect(result.expiredContracts).toEqual([]);
  });

  it('excludes LIFETIME contracts even with a past end_date', () => {
    insertContract(db, {
      name: 'Lifetime Old',
      billing_interval: 'LIFETIME',
      end_date: daysAgo(10),
    });
    const result = service.getDashboardData();
    expect(result.expiredContracts).toHaveLength(0);
  });

  it('includes both ACTIVE and INACTIVE contracts with a past end_date', () => {
    insertContract(db, { name: 'ActiveExpired', end_date: daysAgo(3), status: 'ACTIVE' });
    insertContract(db, { name: 'InactiveExpired', end_date: daysAgo(7), status: 'INACTIVE' });
    const result = service.getDashboardData();
    expect(result.expiredContracts).toHaveLength(2);
  });

  it('orders by end_date descending (most-recently-expired first)', () => {
    insertContract(db, { name: 'LongAgo', end_date: daysAgo(30) });
    insertContract(db, { name: 'Recent', end_date: daysAgo(2) });
    const result = service.getDashboardData();
    expect(result.expiredContracts[0]?.name).toBe('Recent');
    expect(result.expiredContracts[1]?.name).toBe('LongAgo');
  });

  it('computes daysOverdue correctly', () => {
    insertContract(db, { name: 'Overdue5', end_date: daysAgo(5) });
    const result = service.getDashboardData();
    expect(result.expiredContracts[0]?.daysOverdue).toBe(5);
  });

  it('maps anonymize column to boolean (false when 0)', () => {
    insertContract(db, { name: 'Public', end_date: daysAgo(3), anonymize: 0 });
    const result = service.getDashboardData();
    expect(result.expiredContracts[0]?.anonymize).toBe(false);
  });

  it('maps anonymize column to boolean (true when 1)', () => {
    insertContract(db, { name: 'Private', end_date: daysAgo(3), anonymize: 1 });
    const result = service.getDashboardData();
    expect(result.expiredContracts[0]?.anonymize).toBe(true);
  });
});
