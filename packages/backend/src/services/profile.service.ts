import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { UserRow, EmailVerificationRow } from '../db/client.js';

export type UpdateDisplayNameResult = 'updated' | 'not-found';

export type RequestEmailChangeResult =
  | { outcome: 'requested'; token: string; expiresAt: string }
  | { outcome: 'duplicate' }
  | { outcome: 'not-found' };

export type ConfirmEmailChangeResult = 'confirmed' | 'not-found' | 'expired';

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export class ProfileService {
  constructor(private readonly db: Database.Database) {}

  updateDisplayName(userId: string, displayName: string): UpdateDisplayNameResult {
    const result = this.db
      .prepare(
        `UPDATE users SET display_name = ?, updated_at = ? WHERE id = ? AND status = 'ACTIVE'`,
      )
      .run(displayName, new Date().toISOString(), userId);
    return result.changes > 0 ? 'updated' : 'not-found';
  }

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
        .prepare(`UPDATE users SET email = ?, updated_at = ? WHERE id = ?`)
        .run(row.new_email, new Date().toISOString(), row.user_id);
      this.db.prepare(`DELETE FROM email_verifications WHERE token = ?`).run(token);
    });
    confirm();

    return 'confirmed';
  }
}
