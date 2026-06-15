import 'dotenv/config';
import { getDb, runMigrations } from '../db/client.js';
import { MailerService } from '../services/mailer.service.js';
import { NotificationService } from '../services/notification.service.js';
import type { EmailSummaryFrequency } from '@pcm/shared';

/**
 * One-shot script for manually triggering a summary email run outside the cron scheduler.
 * Useful for testing email delivery locally.
 *
 * Usage:
 *   npx tsx src/scripts/send-summary-email.ts [WEEKLY|MONTHLY] [userId]
 *
 * Examples:
 *   npx tsx src/scripts/send-summary-email.ts WEEKLY
 *   npx tsx src/scripts/send-summary-email.ts MONTHLY
 *   npx tsx src/scripts/send-summary-email.ts WEEKLY <user-id>
 */

const VALID_FREQUENCIES: EmailSummaryFrequency[] = ['WEEKLY', 'MONTHLY'];

const rawFrequency = (process.argv[2] ?? 'WEEKLY').toUpperCase();
const userId = process.argv[3];

if (!VALID_FREQUENCIES.includes(rawFrequency as EmailSummaryFrequency)) {
  console.error(`Invalid frequency "${rawFrequency}". Use WEEKLY or MONTHLY.`);
  process.exit(1);
}

const frequency = rawFrequency as EmailSummaryFrequency;

const db = getDb(process.env['DATABASE_PATH']);
runMigrations(db);

const mailer = MailerService.fromEnv();
const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
const service = new NotificationService(db, mailer, appUrl);

if (userId) {
  console.log(`Sending ${frequency} summary email to user ${userId}…`);
  await service.sendSummaryEmailForUser(userId);
  console.log('Done.');
} else {
  console.log(`Sending ${frequency} summary emails to all opted-in users…`);
  await service.sendSummaryEmails(frequency);
  console.log('Done.');
}
