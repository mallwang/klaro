import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  AccountSchema,
  CreateSignupRequestBodySchema,
  RejectSignupRequestBodySchema,
  SignupRequestSchema,
} from '@pcm/shared';
import { SignupRequestService } from '../services/signup-request.service.js';

/**
 * Fastify route plugin for the public self-service sign-up lifecycle: submission,
 * verification, and admin review (list/approve/reject/delete).
 */

const TokenParams = z.object({ token: z.string() });

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
 * Registers sign-up routes under /api/signup and /api/signup-requests on the Fastify
 * instance.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function signupRoutes(fastify: FastifyInstance): Promise<void> {
  const signupRequestService = new SignupRequestService(fastify.db);

  fastify.post('/api/signup', async (request, reply) => {
    const body = CreateSignupRequestBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = signupRequestService.create(body.data.email, body.data.password);
    if (result === 'blacklisted') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'This email address cannot be used to sign up right now',
      });
    }

    try {
      if (!fastify.mailer) throw new Error('SMTP not configured');
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/signup/verify/${result.token}`;
      await fastify.mailer.sendSignupVerificationEmail(
        result.email,
        link,
        result.verificationExpiresAt,
      );
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send sign-up verification email');
      fastify.db.prepare(`DELETE FROM signup_requests WHERE token = ?`).run(result.token);
      return reply.status(502).send({
        statusCode: 502,
        error: 'Bad Gateway',
        message:
          'Verification email could not be sent. Please check the email address and try again.',
      });
    }

    return reply.status(201).send(SignupRequestSchema.parse(result));
  });

  fastify.post('/api/signup/:token/verify', async (request, reply) => {
    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const outcome = signupRequestService.verify(params.data.token);
    if (outcome.outcome === 'not-found') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: "This verification link isn't valid",
      });
    }
    if (outcome.outcome === 'already-used') {
      return reply
        .status(410)
        .send({ statusCode: 410, error: 'Gone', message: 'This link has already been used' });
    }
    if (outcome.outcome === 'expired') {
      return reply.status(410).send({
        statusCode: 410,
        error: 'Gone',
        message: 'This link has expired — you may sign up again with the same email address',
      });
    }

    const admins = fastify.db
      .prepare<
        [],
        { email: string; email_language: string }
      >(`SELECT email, email_language FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`)
      .all();

    if (fastify.mailer) {
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/admin/accounts`;
      for (const admin of admins) {
        fastify.mailer
          .sendAdminSignupNotificationEmail(admin.email, outcome.email, link, admin.email_language)
          .catch((err) => {
            fastify.log.error({ err }, 'Failed to send admin sign-up notification email');
          });
      }
    }

    return reply.status(200).send({ email: outcome.email, status: 'PENDING_REVIEW' });
  });

  fastify.get('/api/signup-requests', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);
    return reply.send(signupRequestService.list().map((req) => SignupRequestSchema.parse(req)));
  });

  fastify.post('/api/signup-requests/:token/approve', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const result = signupRequestService.approve(params.data.token);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Sign-up request not found' });
    }
    if (result === 'not-pending') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Sign-up request is not currently awaiting review',
      });
    }

    if (fastify.mailer) {
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      fastify.mailer.sendWelcomeEmail(result.user.email, `${appUrl}/sign-in`).catch((err) => {
        fastify.log.error({ err }, 'Failed to send welcome email');
      });
    }

    return reply.status(201).send(
      AccountSchema.parse({
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.display_name,
        role: result.user.role,
        status: result.user.status,
        createdAt: result.user.created_at,
      }),
    );
  });

  fastify.post('/api/signup-requests/:token/reject', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const body = RejectSignupRequestBodySchema.safeParse(request.body ?? {});
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = signupRequestService.reject(params.data.token, body.data.reason);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Sign-up request not found' });
    }
    if (result === 'not-pending') {
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'Sign-up request is not currently awaiting review',
      });
    }

    if (fastify.mailer) {
      fastify.mailer
        .sendSignupRejectionEmail(result.request.email, result.request.rejectionReason ?? undefined)
        .catch((err) => {
          fastify.log.error({ err }, 'Failed to send sign-up rejection email');
        });
    }

    return reply.status(200).send(SignupRequestSchema.parse(result.request));
  });

  fastify.delete('/api/signup-requests/:token', async (request, reply) => {
    if (request.user?.role !== 'ADMIN') return forbidden(reply);

    const params = TokenParams.safeParse(request.params);
    if (!params.success) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: 'Bad Request', message: 'Invalid token' });
    }

    const result = signupRequestService.delete(params.data.token);
    if (result === 'not-found') {
      return reply
        .status(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Sign-up request not found' });
    }
    return reply.status(204).send();
  });
}
