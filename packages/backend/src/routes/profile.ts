import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  UpdateDisplayNameBodySchema,
  RequestEmailChangeBodySchema,
  UpdateNotificationPreferencesBodySchema,
} from '@pcm/shared';
import { ProfileService } from '../services/profile.service.js';
import { computeNextSendAt } from '../services/notification.service.js';
import { SESSION_COOKIE_NAME } from '../server.js';

/**
 * Fastify route plugin for user profile operations: display name updates, email change
 * requests, and self-service account deletion.
 */

const TokenParams = z.object({ token: z.string() });

/**
 * Registers profile routes under /api/profile on the Fastify instance.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
  const profileService = new ProfileService(fastify.db);

  // DELETE /api/profile — delete own account
  fastify.delete('/api/profile', async (request, reply) => {
    const result = profileService.deleteSelf(request.user!.id);
    if (result === 'last-admin') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Cannot delete the last active administrator account',
      });
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return reply.status(204).send();
  });

  // PATCH /api/profile — update display name
  fastify.patch('/api/profile', async (request, reply) => {
    const body = UpdateDisplayNameBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }
    const result = profileService.updateDisplayName(request.user!.id, body.data.displayName);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    }
    return reply.status(204).send();
  });

  // POST /api/profile/email-change — request email address change
  fastify.post('/api/profile/email-change', async (request, reply) => {
    const body = RequestEmailChangeBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = profileService.requestEmailChange(request.user!.id, body.data.email);

    if (result.outcome === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    }
    if (result.outcome === 'duplicate') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'This email address is already in use by another account',
      });
    }

    try {
      if (!fastify.mailer) throw new Error('SMTP not configured');
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/email-change/confirm/${result.token}`;
      await fastify.mailer.sendEmailVerificationEmail(body.data.email, link, result.expiresAt);
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send email verification email');
      fastify.db.prepare(`DELETE FROM email_verifications WHERE token = ?`).run(result.token);
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'Verification email could not be sent. Please try again.',
      });
    }

    return reply.status(202).send({ message: 'Verification email sent' });
  });

  // GET /api/profile/email-change/pending — get pending email change
  fastify.get('/api/profile/email-change/pending', async (request, reply) => {
    const pending = profileService.getPendingEmailChange(request.user!.id);
    return reply.send({ pendingEmail: pending?.pendingEmail ?? null });
  });

  // GET /api/profile/notification-preferences
  fastify.get('/api/profile/notification-preferences', async (request, reply) => {
    const row = fastify.db
      .prepare<
        [string],
        { summary_email_enabled: number; summary_email_frequency: string | null }
      >(`SELECT summary_email_enabled, summary_email_frequency FROM users WHERE id = ?`)
      .get(request.user!.id);

    const enabled = (row?.summary_email_enabled ?? 0) !== 0;
    const frequency = row?.summary_email_frequency ?? null;

    return reply.send({
      summaryEmailEnabled: enabled,
      summaryEmailFrequency: frequency,
      nextSendAt:
        enabled && frequency ? computeNextSendAt(frequency as 'WEEKLY' | 'MONTHLY') : null,
    });
  });

  // PATCH /api/profile/notification-preferences
  fastify.patch('/api/profile/notification-preferences', async (request, reply) => {
    const body = UpdateNotificationPreferencesBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const { summaryEmailEnabled, summaryEmailFrequency } = body.data;
    fastify.db
      .prepare(
        `UPDATE users
         SET summary_email_enabled = ?,
             summary_email_frequency = ?
         WHERE id = ?`,
      )
      .run(
        summaryEmailEnabled ? 1 : 0,
        summaryEmailEnabled ? (summaryEmailFrequency ?? null) : null,
        request.user!.id,
      );

    return reply.status(204).send();
  });

  // POST /api/profile/email-change/:token/confirm — confirm email change (public)
  fastify.post('/api/profile/email-change/:token/confirm', async (request, reply) => {
    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const result = profileService.confirmEmailChange(params.data.token);

    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'This link is not valid' });
    }
    if (result === 'expired') {
      return reply
        .status(410)
        .send({ statusCode: 410, error: 'Gone', message: 'This link has expired' });
    }

    const { newEmail } = result;
    if (fastify.mailer) {
      fastify.mailer
        .sendEmailChangeConfirmationEmail(newEmail, new Date().toISOString())
        .catch((err) => {
          fastify.log.error({ err }, 'Failed to send email change confirmation email');
        });
    }

    return reply.send({ message: 'Email address updated successfully' });
  });
}
