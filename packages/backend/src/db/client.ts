import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(
  dbPath = join(__dirname, '../../../../data/contracts.db'),
): Database.Database {
  if (!db) {
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function createDb(dbPath?: string): Database.Database {
  const instance = new Database(dbPath ?? ':memory:');
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  return instance;
}

export function runMigrations(instance: Database.Database): void {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  instance.exec(schema);

  // Migrate existing databases: replace monthly_amount with amount + billing_interval
  const hasOldColumn = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'monthly_amount');

  if (hasOldColumn) {
    instance.exec(`
      ALTER TABLE contracts ADD COLUMN amount REAL NOT NULL DEFAULT 0.0;
      ALTER TABLE contracts ADD COLUMN billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
        CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME'));
      UPDATE contracts SET amount = monthly_amount;
      ALTER TABLE contracts DROP COLUMN monthly_amount;
    `);
  }

  const hasNewFields = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'start_date');

  if (!hasNewFields) {
    instance.exec(`
      ALTER TABLE contracts ADD COLUMN start_date TEXT;
      ALTER TABLE contracts ADD COLUMN details TEXT CHECK(details IS NULL OR length(details) <= 2000);
      ALTER TABLE contracts ADD COLUMN service_url TEXT;
      ALTER TABLE contracts ADD COLUMN cancellation_period_value INTEGER;
      ALTER TABLE contracts ADD COLUMN cancellation_period_unit TEXT CHECK(
        cancellation_period_unit IS NULL
        OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS')
      );
    `);
  }

  const hasAnonymize = instance
    .prepare<[], { name: string }>(`PRAGMA table_info(contracts)`)
    .all()
    .some((col) => col.name === 'anonymize');

  if (!hasAnonymize) {
    instance.exec(`ALTER TABLE contracts ADD COLUMN anonymize INTEGER NOT NULL DEFAULT 0`);
  }

  const schemaRow = instance
    .prepare<
      [],
      { sql: string }
    >(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'contracts'`)
    .get();

  if (schemaRow && !schemaRow.sql.includes("'YEARS'")) {
    instance.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE contracts_new (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL CHECK(length(name) <= 200),
        category TEXT NOT NULL CHECK(category IN (
          'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
        amount REAL NOT NULL DEFAULT 0.0,
        billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
          CHECK(billing_interval IN ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
        status TEXT NOT NULL DEFAULT 'ACTIVE'
          CHECK(status IN ('ACTIVE','INACTIVE')),
        end_date TEXT,
        start_date TEXT,
        details TEXT CHECK(details IS NULL OR length(details) <= 2000),
        service_url TEXT,
        cancellation_period_value INTEGER,
        cancellation_period_unit TEXT CHECK(
          cancellation_period_unit IS NULL
          OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS','YEARS')
        ),
        anonymize INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO contracts_new
        (id, name, category, amount, billing_interval, status, end_date,
         start_date, details, service_url, cancellation_period_value,
         cancellation_period_unit, anonymize, created_at, updated_at)
      SELECT
        id, name, category, amount, billing_interval, status, end_date,
        start_date, details, service_url, cancellation_period_value,
        cancellation_period_unit, anonymize, created_at, updated_at
      FROM contracts;
      DROP TABLE contracts;
      ALTER TABLE contracts_new RENAME TO contracts;
      COMMIT;
    `);
  }
}

export interface ContractRow {
  id: string;
  name: string;
  category: string;
  amount: number;
  billing_interval: string;
  status: string;
  end_date: string | null;
  start_date: string | null;
  details: string | null;
  service_url: string | null;
  cancellation_period_value: number | null;
  cancellation_period_unit: string | null;
  anonymize: number;
  created_at: string;
  updated_at: string;
}
