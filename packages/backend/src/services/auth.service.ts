import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { SessionUser } from '@pcm/shared';
import type { UserRow, SessionRow } from '../db/client.js';
import { hashPassword, verifyPassword } from './password.js';

/**
 * Authentication service covering sign-in, session lifecycle, and brute-force lockout.
 */

const LOCKOUT_THRESHOLD = 5;
const BASE_LOCKOUT_MINUTES = 1;
const MAX_LOCKOUT_MINUTES = 60;

export const SESSION_INACTIVITY_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Name of the HTTP-only cookie carrying the opaque session token. */
export const SESSION_COOKIE_NAME = 'session_id';

/**
 * Maps a stored user row to the public, credential-free shape sent to clients.
 *
 * @param user - The raw database user row
 * @returns A SessionUser object safe to expose over the API
 */
export function toSessionUser(user: UserRow): SessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as SessionUser['role'],
  };
}

export type SignInResult =
  | { outcome: 'success'; user: UserRow; session: SessionRow }
  | { outcome: 'invalid' }
  | { outcome: 'locked'; retryAt: string };

/**
 * Handles credential verification, session lifecycle, and brute-force lockout.
 * Sessions are server-side rows so that sign-out, inactivity expiry, and account
 * removal all reduce to a delete or lookup-miss.
 */
export class AuthService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Authenticates a user by email and password, enforcing brute-force lockout.
   *
   * @param email - The user's email address (case-insensitive)
   * @param password - The plaintext password to verify
   * @returns A SignInResult describing the outcome: success with session, invalid
   *   credentials, or locked account with a retry timestamp
   */
  signIn(email: string, password: string): SignInResult {
    const user = this.db
      .prepare<
        [string],
        UserRow
      >(`SELECT * FROM users WHERE email = ? COLLATE NOCASE AND status = 'ACTIVE'`)
      .get(email);

    if (!user) {
      return { outcome: 'invalid' };
    }

    if (user.locked_until && user.locked_until > new Date().toISOString()) {
      return { outcome: 'locked', retryAt: user.locked_until };
    }

    if (!verifyPassword(password, user.password_hash, user.password_salt)) {
      this.recordFailedAttempt(user);
      return { outcome: 'invalid' };
    }

    this.resetFailedAttempts(user.id);
    const session = this.createSession(user.id);
    return { outcome: 'success', user, session };
  }

  /**
   * Increments the failed-login counter and applies an exponential lockout if the
   * threshold is reached.
   *
   * @param user - The user row to update
   */
  private recordFailedAttempt(user: UserRow): void {
    const failedAttempts = user.failed_attempts + 1;
    let lockedUntil: string | null = user.locked_until;
    if (failedAttempts >= LOCKOUT_THRESHOLD) {
      const minutes = Math.min(
        BASE_LOCKOUT_MINUTES * 2 ** (failedAttempts - LOCKOUT_THRESHOLD),
        MAX_LOCKOUT_MINUTES,
      );
      lockedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
    }
    this.db
      .prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
      )
      .run(failedAttempts, lockedUntil, new Date().toISOString(), user.id);
  }

  /**
   * Clears the failed-login counter and lockout timestamp after a successful sign-in.
   *
   * @param userId - The ID of the user whose counters should be reset
   */
  private resetFailedAttempts(userId: string): void {
    this.db
      .prepare(
        `UPDATE users SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), userId);
  }

  /**
   * Creates a new server-side session row for the given user and returns it.
   *
   * @param userId - The ID of the user for whom a session should be created
   * @returns The newly inserted session row
   */
  createSession(userId: string): SessionRow {
    const now = new Date();
    const row: SessionRow = {
      id: randomBytes(32).toString('hex'),
      user_id: userId,
      created_at: now.toISOString(),
      last_seen_at: now.toISOString(),
      expires_at: new Date(now.getTime() + SESSION_INACTIVITY_TIMEOUT_MS).toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at)
         VALUES (@id, @user_id, @created_at, @last_seen_at, @expires_at)`,
      )
      .run(row);
    return row;
  }

  /**
   * Resolves a session token to its current, active user — refreshing the sliding
   * inactivity window (capped at the absolute maximum lifetime) on every valid lookup.
   * Deletes (and returns null for) any session that is expired, inactive too long, or
   * whose account is no longer active — this single code path is what makes inactivity
   * expiry and immediate invalidation on account removal simple lookup-misses.
   *
   * @param sessionId - The opaque session token from the cookie
   * @returns The user row if the session is valid and active, or null otherwise
   */
  resolveSession(sessionId: string): UserRow | null {
    const session = this.db
      .prepare<[string], SessionRow>(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (!session) return null;

    const now = Date.now();
    const lastSeen = new Date(session.last_seen_at).getTime();
    const expiresAt = new Date(session.expires_at).getTime();
    const createdAt = new Date(session.created_at).getTime();

    if (now > expiresAt || now - lastSeen > SESSION_INACTIVITY_TIMEOUT_MS) {
      this.destroySession(sessionId);
      return null;
    }

    const user = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`)
      .get(session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      this.destroySession(sessionId);
      return null;
    }

    const refreshedExpiresAt = new Date(
      Math.min(now + SESSION_INACTIVITY_TIMEOUT_MS, createdAt + SESSION_MAX_LIFETIME_MS),
    ).toISOString();
    this.db
      .prepare(`UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?`)
      .run(new Date(now).toISOString(), refreshedExpiresAt, sessionId);

    return user;
  }

  /**
   * Deletes the session row, immediately invalidating the session token.
   *
   * @param sessionId - The opaque session token to invalidate
   */
  destroySession(sessionId: string): void {
    this.db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
  }

  /**
   * Deletes all sessions for a user except the currently active one.
   *
   * @param userId - The ID of the user whose other sessions should be invalidated
   * @param keepSessionId - The session token that should be preserved
   */
  destroyOtherSessions(userId: string, keepSessionId: string): void {
    this.db
      .prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?`)
      .run(userId, keepSessionId);
  }

  /**
   * Verifies the current password and, if correct, replaces it with the new hash.
   *
   * @param userId - The ID of the user changing their password
   * @param currentPassword - The plaintext current password for verification
   * @param newPassword - The new plaintext password to store
   * @returns True if the password was changed; false if the current password was wrong or
   *   the user was not found
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
    const user = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(userId);
    if (!user) return false;
    if (!verifyPassword(currentPassword, user.password_hash, user.password_salt)) return false;

    const { hash, salt } = hashPassword(newPassword);
    this.db
      .prepare(`UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?`)
      .run(hash, salt, new Date().toISOString(), userId);
    return true;
  }
}
