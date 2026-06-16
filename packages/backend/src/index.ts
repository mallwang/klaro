import 'dotenv/config';
import {
  getDb,
  runMigrations,
  purgeExpiredArchivedAccounts,
  purgeStaleInvitations,
} from './db/client.js';
import { buildServer } from './server.js';
import { MailerService } from './services/mailer.service.js';
import { NotificationService } from './services/notification.service.js';
import { SchedulerService } from './services/scheduler.service.js';

/**
 * Application bootstrap entry point: runs migrations, starts maintenance cleanup, wires up
 * optional SMTP, and starts the Fastify HTTP server.
 */

const db = getDb(process.env['DATABASE_PATH']);
const bootstrap = runMigrations(db);
if (bootstrap) {
  console.log('============================================================');
  console.log(' Bootstrap administrator account created');
  console.log(` Email:    ${bootstrap.email}`);
  console.log(` Password: ${bootstrap.password}`);
  console.log(' Sign in and change this password immediately from Account Settings.');
  console.log('============================================================');
}
purgeExpiredArchivedAccounts(db);
purgeStaleInvitations(db);

let mailer: MailerService | undefined;
try {
  mailer = MailerService.fromEnv();
} catch {
  console.warn('SMTP not configured — invitations will fail at send time');
}

const server = await buildServer(db, { mailer });
await server.listen({ port: parseInt(process.env['PORT'] ?? '3000'), host: '0.0.0.0' });

const notification = mailer
  ? new NotificationService(db, mailer, process.env['APP_URL'] ?? 'http://localhost:5173')
  : undefined;
const scheduler = new SchedulerService(() => purgeStaleInvitations(db), notification);
scheduler.start();
