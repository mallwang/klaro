import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { UserRow, EmailVerificationRow } from '../db/client.js';
import type { DeleteSelfResult } from '@pcm/shared';

/**
 * Service layer for user profile mutations: display name updates, email change requests,
 * and self-service account deletion.
 */

export type UpdateDisplayNameResult = 'updated' | 'not-found';

export type RequestEmailChangeResult =
  | { outcome: 'requested'; token: string; expiresAt: string }
  | { outcome: 'duplicate' }
  | { outcome: 'not-found' };

export type ConfirmEmailChangeResult =
  | { outcome: 'confirmed'; newEmail: string }
  | 'not-found'
  | 'expired';

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export class ProfileService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Updates the display name for an active user.
   *
   * @param userId - The ID of the user whose display name should be updated
   * @param displayName - The new display name (1–100 characters)
   * @returns 'updated' on success, or 'not-found' if the user does not exist or is not
   *   active
   */
  updateDisplayName(userId: string, displayName: string): UpdateDisplayNameResult {
    const result = this.db
      .prepare(
        `UPDATE users SET display_name = ?, updated_at = ? WHERE id = ? AND status = 'ACTIVE'`,
      )
      .run(displayName, new Date().toISOString(), userId);
    return result.changes > 0 ? 'updated' : 'not-found';
  }

  /**
   * Initiates an email-change flow by generating a time-limited single-use verification
   * token and storing it in the email_verifications table.
   *
   * @param userId - The ID of the user requesting the change
   * @param newEmail - The desired new email address
   * @returns A result object with the verification token and expiry, 'duplicate' if the
   *   address is already in use by an active account, or 'not-found' if the user does
   *   not exist
   */
  requestEmailChange(userId: string, newEmail: string): RequestEmailChangeResult {
    const user = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ? AND status = 'ACTIVE'`)
      .get(userId);
    if (!user) return { outcome: 'not-found' };

    const duplicate = this.db
      .prepare<
        [string, string],
        { id: string }
      >(`SELECT id FROM users WHERE email = ? COLLATE NOCASE AND status = 'ACTIVE' AND id != ?`)
      .get(newEmail, userId);
    if (duplicate) return { outcome: 'duplicate' };

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_EXPIRY_MS).toISOString();

    const insert = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM email_verifications WHERE user_id = ?`).run(userId);
      this.db
        .prepare(
          `INSERT INTO email_verifications (token, user_id, new_email, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(token, userId, newEmail, expiresAt, now.toISOString());
    });
    insert();

    return { outcome: 'requested', token, expiresAt };
  }

  /**
   * Returns the pending new email address if a valid (non-expired) verification request
   * exists for the user.
   *
   * @param userId - The ID of the user to query
   * @returns An object with the pending email, or null if no valid request exists
   */
  getPendingEmailChange(userId: string): { pendingEmail: string } | null {
    const row = this.db
      .prepare<
        [string],
        EmailVerificationRow
      >(`SELECT * FROM email_verifications WHERE user_id = ?`)
      .get(userId);
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) {
      this.db.prepare(`DELETE FROM email_verifications WHERE token = ?`).run(row.token);
      return null;
    }
    return { pendingEmail: row.new_email };
  }

  /**
   * Deletes the calling user's own account, refusing if they are the sole remaining
   * active administrator.
   *
   * @param userId - The ID of the user requesting deletion
   * @returns 'deleted' on success, or 'last-admin' if the deletion would leave the
   *   application without any active admin
   */
  deleteSelf(userId: string): DeleteSelfResult {
    const user = this.db
      .prepare<
        [string],
        { role: string }
      >(`SELECT role FROM users WHERE id = ? AND status = 'ACTIVE'`)
      .get(userId);

    if (user?.role === 'ADMIN') {
      const { count } = this.db
        .prepare<
          [],
          { count: number }
        >(`SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`)
        .get()!;
      if (count <= 1) return 'last-admin';
    }

    this.db.transaction(() => {
      this.db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    })();

    return 'deleted';
  }

  /**
   * Applies a verified email change, updating the user row and retiring any archived
   * account that previously held the new address.
   *
   * @param token - The verification token issued during the email-change request
   * @returns A confirmed result with the new email, or 'not-found'/'expired' if the token
   *   is invalid or has passed its expiry
   *
   * The retired-address update prevents a UNIQUE constraint violation when the new
   * address previously belonged to an archived account.
   */
  confirmEmailChange(token: string): ConfirmEmailChangeResult {
    const row = this.db
      .prepare<[string], EmailVerificationRow>(`SELECT * FROM email_verifications WHERE token = ?`)
      .get(token);
    if (!row) return 'not-found';

    if (new Date(row.expires_at) < new Date()) {
      this.db.prepare(`DELETE FROM email_verifications WHERE token = ?`).run(token);
      return 'expired';
    }

    const confirm = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE users SET email = id || '@archived.invalid' WHERE email = ? COLLATE NOCASE AND status != 'ACTIVE'`,
        )
        .run(row.new_email);
      this.db
        .prepare(`UPDATE users SET email = ?, updated_at = ? WHERE id = ?`)
        .run(row.new_email, new Date().toISOString(), row.user_id);
      this.db.prepare(`DELETE FROM email_verifications WHERE token = ?`).run(token);
    });
    confirm();

    return { outcome: 'confirmed', newEmail: row.new_email };
  }
}
