import type { FastifyInstance } from 'fastify';
import {
  SignInBodySchema,
  ChangePasswordBodySchema,
  SessionUserSchema,
  RequestPasswordResetBodySchema,
  ResetPasswordBodySchema,
} from '@pcm/shared';
import { SESSION_COOKIE_NAME, toSessionUser } from '../server.js';
import type { UserRow } from '../db/client.js';

/**
 * Fastify route plugin for authentication: sign-in, sign-out, current-user, and password
 * change.
 */

/**
 * Registers authentication routes under /api/auth on the Fastify instance.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/api/auth/sign-in', async (request, reply) => {
    const body = SignInBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = fastify.auth.signIn(body.data.email, body.data.password);

    if (result.outcome === 'invalid') {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    if (result.outcome === 'locked') {
      return reply.status(423).send({
        statusCode: 423,
        error: 'Locked',
        message: `Too many failed attempts. Try again after ${result.retryAt}.`,
      });
    }

    reply.setCookie(SESSION_COOKIE_NAME, result.session.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(result.session.expires_at),
    });
    return reply.status(200).send(SessionUserSchema.parse(toSessionUser(result.user)));
  });

  fastify.post('/api/auth/sign-out', async (request, reply) => {
    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      fastify.auth.destroySession(sessionId);
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return reply.status(204).send();
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    return reply.send(SessionUserSchema.parse(request.user));
  });

  fastify.post('/api/auth/password', async (request, reply) => {
    const body = ChangePasswordBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const userId = request.user!.id;
    const changed = fastify.auth.changePassword(
      userId,
      body.data.currentPassword,
      body.data.newPassword,
    );
    if (!changed) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Current password is incorrect',
      });
    }

    const sessionId = request.cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
      fastify.auth.destroyOtherSessions(userId, sessionId);
    }

    if (fastify.mailer) {
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      fastify.mailer
        .sendPasswordChangeEmail(request.user!.email, `${appUrl}/sign-in`)
        .catch((err) => {
          fastify.log.error({ err }, 'Failed to send password change email');
        });
    }

    return reply.status(204).send();
  });

  fastify.post('/api/auth/forgot-password', async (request, reply) => {
    const body = RequestPasswordResetBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const result = fastify.auth.requestPasswordReset(body.data.email);

    // Always return 202 with generic message to prevent email enumeration
    const genericMessage =
      'If an account exists with that email, a password reset link has been sent.';

    if (result.outcome === 'requested' && fastify.mailer) {
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      const link = `${appUrl}/reset-password/${result.token}`;
      fastify.mailer
        .sendPasswordResetEmail(body.data.email, link, result.expiresAt)
        .catch((err) => {
          fastify.log.error({ err }, 'Failed to send password reset email');
        });
    }

    return reply.status(202).send({ message: genericMessage });
  });

  fastify.post('/api/auth/reset-password/:token', async (request, reply) => {
    const body = ResetPasswordBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: body.error.issues[0]?.message ?? 'Validation error',
      });
    }

    const token = (request.params as { token: string }).token;
    const result = fastify.auth.resetPassword(token, body.data.password);

    if (result.outcome === 'success') {
      const user = fastify.db
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .get(result.userId) as UserRow;
      const session = fastify.auth.createSession(result.userId);

      reply.setCookie(SESSION_COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(session.expires_at),
      });

      return reply.status(200).send(SessionUserSchema.parse(toSessionUser(user)));
    }

    if (result.outcome === 'expired') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Invalid or expired reset link',
      });
    }

    // not-found
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Invalid or expired reset link',
    });
  });
}
