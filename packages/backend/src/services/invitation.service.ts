import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { Invitation } from '@pcm/shared';
import { UserService } from './user.service.js';

/**
 * Service layer for managing the invitation lifecycle: creation, validation, acceptance,
 * cancellation, and resend.
 */

export class DuplicateAccountError extends Error {
  constructor(email: string) {
    super(`An account already exists for ${email}`);
    this.name = 'DuplicateAccountError';
  }
}

export type CancelResult = 'cancelled' | 'not-found' | 'not-pending';
export type ResendResult = Invitation | 'not-found' | 'not-pending';

export type AcceptOutcome =
  | { outcome: 'valid'; email: string }
  | { outcome: 'not-found' }
  | { outcome: 'already-accepted' }
  | { outcome: 'expired' }
  | { outcome: 'no-longer-valid' };

interface InvitationRow {
  token: string;
  email: string;
  invited_by: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
}

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Maps a raw invitation database row to the public Invitation shape.
 *
 * @param row - The raw SQLite invitation row
 * @returns A typed Invitation object
 */
function rowToInvitation(row: InvitationRow): Invitation {
  return {
    token: row.token,
    email: row.email,
    status: row.status as Invitation['status'],
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    cancelledAt: row.cancelled_at,
  };
}

export class InvitationService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Creates a new pending invitation for the given email, superseding any existing
   * pending invitation for the same address in a single transaction.
   *
   * @param email - The email address to invite
   * @param invitedBy - The ID of the admin user sending the invitation
   * @returns The newly created Invitation object
   * @throws {DuplicateAccountError} If an active or archived account already exists for
   *   this email
   */
  create(email: string, invitedBy: string): Invitation {
    const userService = new UserService(this.db);
    const existing = userService.findByEmail(email, { includeArchived: true });
    if (existing) throw new DuplicateAccountError(email);

    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_MS).toISOString();

    const createInvitation = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE invitations SET status = 'SUPERSEDED' WHERE email = ? COLLATE NOCASE AND status = 'PENDING'`,
        )
        .run(email);

      this.db
        .prepare(
          `INSERT INTO invitations (token, email, invited_by, status, expires_at, created_at)
           VALUES (@token, @email, @invited_by, 'PENDING', @expires_at, @created_at)`,
        )
        .run({
          token,
          email,
          invited_by: invitedBy,
          expires_at: expiresAt,
          created_at: now.toISOString(),
        });

      return this.db
        .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
        .get(token)!;
    });

    return rowToInvitation(createInvitation());
  }

  /**
   * Returns all invitations ordered by creation date descending.
   *
   * @returns An array of Invitation objects
   */
  list(): Invitation[] {
    const rows = this.db
      .prepare<[], InvitationRow>(`SELECT * FROM invitations ORDER BY created_at DESC`)
      .all();
    return rows.map(rowToInvitation);
  }

  /**
   * Cancels a pending invitation.
   *
   * @param token - The invitation token to cancel
   * @returns 'cancelled' on success, 'not-found' if the token does not exist, or
   *   'not-pending' if the invitation is not in the PENDING state
   */
  cancel(token: string): CancelResult {
    const row = this.db
      .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
      .get(token);
    if (!row) return 'not-found';
    if (row.status !== 'PENDING') return 'not-pending';

    this.db
      .prepare(`UPDATE invitations SET status = 'CANCELLED', cancelled_at = ? WHERE token = ?`)
      .run(new Date().toISOString(), token);
    return 'cancelled';
  }

  /**
   * Supersedes the existing invitation token and issues a new one with a refreshed expiry.
   *
   * @param token - The current invitation token to supersede
   * @param invitedBy - The ID of the admin user resending the invitation
   * @returns The new Invitation object, or 'not-found'/'not-pending' if the action is
   *   not valid
   */
  resend(token: string, invitedBy: string): ResendResult {
    const row = this.db
      .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
      .get(token);
    if (!row) return 'not-found';
    if (row.status !== 'PENDING') return 'not-pending';

    const newToken = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_MS).toISOString();

    const resendInvitation = this.db.transaction(() => {
      this.db.prepare(`UPDATE invitations SET status = 'SUPERSEDED' WHERE token = ?`).run(token);

      this.db
        .prepare(
          `INSERT INTO invitations (token, email, invited_by, status, expires_at, created_at)
           VALUES (@token, @email, @invited_by, 'PENDING', @expires_at, @created_at)`,
        )
        .run({
          token: newToken,
          email: row.email,
          invited_by: invitedBy,
          expires_at: expiresAt,
          created_at: now.toISOString(),
        });

      return this.db
        .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
        .get(newToken)!;
    });

    return rowToInvitation(resendInvitation());
  }

  /**
   * Checks whether the token corresponds to a usable pending invitation without performing
   * any writes.
   *
   * @param token - The invitation token to validate
   * @returns An AcceptOutcome describing the token's validity; 'valid' includes the
   *   associated email address
   */
  validateToken(token: string): AcceptOutcome {
    const row = this.db
      .prepare<[string], InvitationRow>(`SELECT * FROM invitations WHERE token = ?`)
      .get(token);

    if (!row) return { outcome: 'not-found' };
    if (row.status === 'ACCEPTED') return { outcome: 'already-accepted' };
    if (row.status === 'CANCELLED' || row.status === 'SUPERSEDED')
      return { outcome: 'no-longer-valid' };
    if (row.status === 'PENDING' && new Date(row.expires_at) < new Date())
      return { outcome: 'expired' };

    return { outcome: 'valid', email: row.email };
  }

  /**
   * Marks the invitation as accepted after re-validating the token.
   *
   * @param token - The invitation token being accepted
   * @param userId - The ID of the newly created user account
   * @returns An AcceptOutcome; 'valid' on success, otherwise a failure reason
   */
  accept(token: string, userId: string): AcceptOutcome {
    const validation = this.validateToken(token);
    if (validation.outcome !== 'valid') return validation;

    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE invitations SET status = 'ACCEPTED', accepted_at = ? WHERE token = ?`)
      .run(now, token);

    return validation;
  }
}
