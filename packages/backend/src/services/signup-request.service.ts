import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { SignupRequest } from '@pcm/shared';
import type { SignupRequestRow, UserRow } from '../db/client.js';
import { hashPassword } from './password.js';
import { UserService } from './user.service.js';

/**
 * Service layer for the public self-service sign-up lifecycle: submission, email
 * verification, admin review listing, and approve/reject/delete decisions.
 */

const VERIFICATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export type VerifyOutcome =
  | { outcome: 'valid'; email: string }
  | { outcome: 'not-found' }
  | { outcome: 'already-used' }
  | { outcome: 'expired' };

export type DecisionResult = 'not-found' | 'not-pending';
export type ApproveResult = { outcome: 'approved'; user: UserRow } | DecisionResult;
export type RejectResult = { outcome: 'rejected'; request: SignupRequest } | DecisionResult;

/**
 * Maps a raw sign-up request database row to the public SignupRequest shape.
 *
 * @param row - The raw SQLite signup_requests row
 * @returns A typed SignupRequest object
 */
function rowToSignupRequest(row: SignupRequestRow): SignupRequest {
  return {
    token: row.token,
    email: row.email,
    status: row.status as SignupRequest['status'],
    createdAt: row.created_at,
    verificationExpiresAt: row.verification_expires_at,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    decidedAt: row.decided_at,
  };
}

export class SignupRequestService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Checks whether the given email is already claimed by an active/archived account, a
   * pending invitation, or an existing sign-up request of any status (FR-003).
   *
   * @param email - The email address to check
   * @returns True if the address cannot be used to submit a new sign-up request
   */
  private isEmailBlacklisted(email: string): boolean {
    const userService = new UserService(this.db);
    if (userService.findByEmail(email, { includeArchived: true })) return true;

    const pendingInvitation = this.db
      .prepare(`SELECT 1 FROM invitations WHERE email = ? COLLATE NOCASE AND status = 'PENDING'`)
      .get(email);
    if (pendingInvitation) return true;

    const existingSignup = this.db
      .prepare(`SELECT 1 FROM signup_requests WHERE email = ? COLLATE NOCASE`)
      .get(email);
    return Boolean(existingSignup);
  }

  /**
   * Creates a new UNVERIFIED sign-up request for the given email and password.
   *
   * @param email - The email address submitted by the visitor
   * @param password - The plaintext password chosen by the visitor
   * @returns The newly created SignupRequest, or 'blacklisted' if the email cannot be used
   */
  create(email: string, password: string): SignupRequest | 'blacklisted' {
    if (this.isEmailBlacklisted(email)) return 'blacklisted';

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const verificationExpiresAt = new Date(now.getTime() + VERIFICATION_EXPIRY_MS).toISOString();
    const { hash, salt } = hashPassword(password);

    this.db
      .prepare(
        `INSERT INTO signup_requests
           (token, email, password_hash, password_salt, status, verification_expires_at, created_at)
         VALUES (@token, @email, @password_hash, @password_salt, 'UNVERIFIED', @verification_expires_at, @created_at)`,
      )
      .run({
        token,
        email,
        password_hash: hash,
        password_salt: salt,
        verification_expires_at: verificationExpiresAt,
        created_at: now.toISOString(),
      });

    return rowToSignupRequest(this.findByToken(token)!);
  }

  /**
   * Looks up a sign-up request row by its token.
   *
   * @param token - The sign-up request token
   * @returns The raw row, or null if no request has that token
   */
  private findByToken(token: string): SignupRequestRow | null {
    return (
      this.db
        .prepare<[string], SignupRequestRow>(`SELECT * FROM signup_requests WHERE token = ?`)
        .get(token) ?? null
    );
  }

  /**
   * Marks a sign-up request as verified, transitioning it from UNVERIFIED to PENDING_REVIEW.
   *
   * @param token - The verification token from the emailed link
   * @returns A VerifyOutcome; 'valid' includes the associated email address
   */
  verify(token: string): VerifyOutcome {
    const row = this.findByToken(token);
    if (!row) return { outcome: 'not-found' };
    if (row.status !== 'UNVERIFIED') return { outcome: 'already-used' };
    if (new Date(row.verification_expires_at) < new Date()) return { outcome: 'expired' };

    this.db
      .prepare(
        `UPDATE signup_requests SET status = 'PENDING_REVIEW', verified_at = ? WHERE token = ?`,
      )
      .run(new Date().toISOString(), token);

    return { outcome: 'valid', email: row.email };
  }

  /**
   * Returns all sign-up requests ordered by creation date descending.
   *
   * @returns An array of SignupRequest objects
   */
  list(): SignupRequest[] {
    const rows = this.db
      .prepare<[], SignupRequestRow>(`SELECT * FROM signup_requests ORDER BY created_at DESC`)
      .all();
    return rows.map(rowToSignupRequest);
  }

  /**
   * Approves a PENDING_REVIEW sign-up request: creates an active user account from its
   * stored, already-hashed credentials and deletes the sign-up request row, all within a
   * single transaction.
   *
   * @param token - The sign-up request token to approve
   * @returns The created UserRow on success, or a DecisionResult failure reason
   */
  approve(token: string): ApproveResult {
    const row = this.findByToken(token);
    if (!row) return 'not-found';
    if (row.status !== 'PENDING_REVIEW') return 'not-pending';

    const userService = new UserService(this.db);
    const doApprove = this.db.transaction(() => {
      const current = this.findByToken(token);
      if (!current || current.status !== 'PENDING_REVIEW') return null;

      const user = userService.createFromVerifiedSignup(
        current.email,
        current.password_hash,
        current.password_salt,
      );
      this.db.prepare(`DELETE FROM signup_requests WHERE token = ?`).run(token);
      return user;
    });

    const user = doApprove();
    if (!user) return 'not-pending';
    return { outcome: 'approved', user };
  }

  /**
   * Rejects a PENDING_REVIEW sign-up request, recording the optional reason. The row (and its
   * blacklist effect) persists until an admin deletes it.
   *
   * @param token - The sign-up request token to reject
   * @param reason - Optional free-text reason supplied by the rejecting admin
   * @returns The updated SignupRequest on success, or a DecisionResult failure reason
   */
  reject(token: string, reason: string | undefined): RejectResult {
    const row = this.findByToken(token);
    if (!row) return 'not-found';
    if (row.status !== 'PENDING_REVIEW') return 'not-pending';

    const rejectTx = this.db.transaction(() => {
      const current = this.findByToken(token);
      if (!current || current.status !== 'PENDING_REVIEW') return null;

      const now = new Date().toISOString();
      this.db
        .prepare(
          `UPDATE signup_requests SET status = 'REJECTED', rejection_reason = ?, decided_at = ? WHERE token = ?`,
        )
        .run(reason ?? null, now, token);

      return rowToSignupRequest(this.findByToken(token)!);
    });

    const request = rejectTx();
    if (!request) return 'not-pending';
    return { outcome: 'rejected', request };
  }

  /**
   * Deletes a sign-up request unconditionally, regardless of its status. For a REJECTED row,
   * this is the only action that clears the blacklisted address (FR-014).
   *
   * @param token - The sign-up request token to delete
   * @returns 'deleted' on success, or 'not-found' if no request has that token
   */
  delete(token: string): 'deleted' | 'not-found' {
    const result = this.db.prepare(`DELETE FROM signup_requests WHERE token = ?`).run(token);
    return result.changes > 0 ? 'deleted' : 'not-found';
  }
}
