import type { FastifyInstance } from 'fastify';
import { SendTestEmailBodySchema } from '@pcm/shared';
import { MailerError } from '../services/mailer.service.js';

/**
 * Fastify route plugin for admin-only operations: SMTP test email dispatch and logo cache
 * management.
 */

/**
 * Sends a 403 Forbidden response with a standard error body.
 *
 * @param reply - The Fastify reply object
 * @returns The reply after sending the 403 status
 */
function forbidden(reply: import('fastify').FastifyReply) {
  return reply.status(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Administrator access required',
  });
}

/**
 * Registers admin-only routes under /api/admin on the Fastify instance.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') {
      return forbidden(reply);
    }
  });

  fastify.post('/api/admin/email/test', async (request, reply) => {
    const body = SendTestEmailBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    try {
      if (!fastify.mailer) throw new MailerError('SMTP not configured');
      await fastify.mailer.sendTestEmail(body.data.email);
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send test email');
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: err instanceof MailerError ? err.message : 'Failed to send test email',
      });
    }

    return reply.send({ message: 'Test email sent' });
  });

  /**
   * Returns the current logo cache contents: total entry count and all cached provider names.
   *
   * @returns `{ count: number, keys: string[] }` — cache size and sorted list of cached names
   */
  fastify.get('/api/admin/logos/cache', async (_request, reply) => {
    const rows = fastify.db
      .prepare<[], { name: string }>(`SELECT name FROM logo_cache ORDER BY name`)
      .all();
    return reply.send({ count: rows.length, keys: rows.map((r) => r.name) });
  });

  /**
   * Removes all entries from the logo_cache table and returns the number of deleted rows.
   * Subsequent logo requests will re-fetch from logo.dev and repopulate the cache.
   *
   * @returns `{ deleted: number }` — the count of rows removed
   */
  fastify.delete('/api/admin/logos/cache', async (_request, reply) => {
    const result = fastify.db.prepare(`DELETE FROM logo_cache`).run();
    return reply.send({ deleted: result.changes });
  });
}
