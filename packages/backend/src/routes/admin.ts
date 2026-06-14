import type { FastifyInstance } from 'fastify';
import { SendTestEmailBodySchema } from '@pcm/shared';
import { MailerError } from '../services/mailer.service.js';

function forbidden(reply: import('fastify').FastifyReply) {
  return reply.status(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Administrator access required',
  });
}

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
}
