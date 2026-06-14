import { createDb, runMigrations } from './client.js';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CLI script that drops the contracts table and re-runs migrations, providing a clean slate
 * for development without deleting the database file.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../../../../data');
mkdirSync(dataDir, { recursive: true });
const db = createDb(join(dataDir, 'contracts.db'));
db.exec('DROP TABLE IF EXISTS contracts;');
runMigrations(db);
console.log('Database reset complete.');
db.close();
