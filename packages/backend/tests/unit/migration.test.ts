import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/db/client.js';

function columnNames(db: Database.Database, table: string): string[] {
  return db
    .prepare<[], { name: string }>(`PRAGMA table_info(${table})`)
    .all()
    .map((r) => r.name);
}

function makeOldSchemaDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // Create the pre-migration schema with monthly_amount
  db.exec(`
    CREATE TABLE contracts (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL CHECK(length(name) <= 200),
      category       TEXT NOT NULL CHECK(category IN (
                       'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
      monthly_amount REAL NOT NULL CHECK(monthly_amount >= 0),
      status         TEXT NOT NULL DEFAULT 'ACTIVE'
                       CHECK(status IN ('ACTIVE','INACTIVE')),
      end_date       TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );
  `);
  return db;
}

describe('runMigrations – fresh database', () => {
  it('creates contracts table with amount and billing_interval columns', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('amount');
    expect(cols).toContain('billing_interval');
    expect(cols).not.toContain('monthly_amount');
    db.close();
  });
});

describe('runMigrations – existing database with monthly_amount', () => {
  it('migrates monthly_amount to amount and billing_interval', () => {
    const db = makeOldSchemaDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
       VALUES (?, 'Netflix', 'SUBSCRIPTIONS', 15.99, 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('amount');
    expect(cols).toContain('billing_interval');
    expect(cols).not.toContain('monthly_amount');

    const row = db
      .prepare<
        [string],
        { amount: number; billing_interval: string }
      >(`SELECT amount, billing_interval FROM contracts WHERE id = ?`)
      .get(id)!;
    expect(row.amount).toBe(15.99);
    expect(row.billing_interval).toBe('MONTHLY');
    db.close();
  });

  it('preserves all existing rows after migration', () => {
    const db = makeOldSchemaDb();
    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      db.prepare(
        `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
         VALUES (?, ?, 'OTHER', 10, 'ACTIVE', null, ?, ?)`,
      ).run(crypto.randomUUID(), `Contract ${i}`, now, now);
    }

    runMigrations(db);

    const count = db.prepare<[], { n: number }>(`SELECT COUNT(*) as n FROM contracts`).get()!!.n;
    expect(count).toBe(3);
    db.close();
  });

  it('is idempotent — running migrations twice does not fail', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    expect(() => runMigrations(db)).not.toThrow();
    db.close();
  });
});

describe('runMigrations – new contract fields', () => {
  it('adds all five new columns to a fresh database', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    runMigrations(db);
    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('start_date');
    expect(cols).toContain('details');
    expect(cols).toContain('service_url');
    expect(cols).toContain('cancellation_period_value');
    expect(cols).toContain('cancellation_period_unit');
    db.close();
  });

  it('adds all five new columns to an existing database missing them', () => {
    const db = makeOldSchemaDb();
    // Insert a legacy row first (old schema has monthly_amount, not amount)
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, monthly_amount, status, end_date, created_at, updated_at)
       VALUES (?, 'Legacy Contract', 'OTHER', 5.00, 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const cols = columnNames(db, 'contracts');
    expect(cols).toContain('start_date');
    expect(cols).toContain('details');
    expect(cols).toContain('service_url');
    expect(cols).toContain('cancellation_period_value');
    expect(cols).toContain('cancellation_period_unit');
    db.close();
  });

  it('existing rows have NULL for all five new columns after migration', () => {
    const db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    // Create a schema without the new columns
    db.exec(`
      CREATE TABLE contracts (
        id               TEXT PRIMARY KEY,
        name             TEXT NOT NULL CHECK(length(name) <= 200),
        category         TEXT NOT NULL CHECK(category IN (
                           'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
        amount           REAL NOT NULL CHECK(amount >= 0),
        billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
                           CHECK(billing_interval IN (
                             'WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
        status           TEXT NOT NULL DEFAULT 'ACTIVE'
                           CHECK(status IN ('ACTIVE','INACTIVE')),
        end_date         TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );
    `);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO contracts (id, name, category, amount, billing_interval, status, end_date, created_at, updated_at)
       VALUES (?, 'Old Contract', 'SUBSCRIPTIONS', 9.99, 'MONTHLY', 'ACTIVE', null, ?, ?)`,
    ).run(id, now, now);

    runMigrations(db);

    const row = db
      .prepare<
        [string],
        {
          start_date: string | null;
          details: string | null;
          service_url: string | null;
          cancellation_period_value: number | null;
          cancellation_period_unit: string | null;
        }
      >(
        `SELECT start_date, details, service_url, cancellation_period_value, cancellation_period_unit
         FROM contracts WHERE id = ?`,
      )
      .get(id)!;
    expect(row.start_date).toBeNull();
    expect(row.details).toBeNull();
    expect(row.service_url).toBeNull();
    expect(row.cancellation_period_value).toBeNull();
    expect(row.cancellation_period_unit).toBeNull();
    db.close();
  });
});
