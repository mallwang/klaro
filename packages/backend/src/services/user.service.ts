import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { Account, CreateAccountBody, Role } from '@pcm/shared';
import type { UserRow } from '../db/client.js';
import { hashPassword } from './password.js';

/**
 * Service layer for admin-facing user account management: create, archive, reactivate,
 * delete, and role changes.
 */

/**
 * Maps a raw user database row to the public Account shape.
 *
 * @param row - The raw SQLite user row
 * @returns A typed Account object safe to expose over the API
 */
function rowToAccount(row: UserRow): Account {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role as Account['role'],
    status: row.status as Account['status'],
    createdAt: row.created_at,
  };
}

export type CreateAccountResult =
  | { outcome: 'created'; account: Account }
  | { outcome: 'duplicate' };
export type ArchiveResult = 'archived' | 'not-found' | 'last-admin';
export type ReactivateResult = 'reactivated' | 'not-found' | 'not-archived';
export type ChangeRoleResult = 'changed' | 'not-found' | 'last-admin';
export type DeleteResult = 'deleted' | 'not-found' | 'not-archived';

/**
 * Account lifecycle for multi-user management: list/create accounts, archive (with
 * immediate session invalidation) and reactivate, and change roles — all guarded so the
 * application can never be left without an active administrator.
 */
export class UserService {
  constructor(private readonly db: Database.Database) {}

  /**
   * Returns all user accounts ordered by creation date ascending.
   *
   * @returns An array of Account objects
   */
  list(): Account[] {
    const rows = this.db.prepare<[], UserRow>(`SELECT * FROM users ORDER BY created_at ASC`).all();
    return rows.map(rowToAccount);
  }

  /**
   * Creates a new active user account with the given credentials and role.
   *
   * @param body - Validated account creation payload including the initial password
   * @returns A created result with the new Account, or 'duplicate' if the email is
   *   already registered (active or archived)
   */
  create(body: CreateAccountBody): CreateAccountResult {
    const existing = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`)
      .get(body.email);
    if (existing) return { outcome: 'duplicate' };

    const { hash, salt } = hashPassword(body.initialPassword);
    const now = new Date().toISOString();
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
         VALUES (@id, @email, @display_name, @password_hash, @password_salt, @role, 'ACTIVE', @created_at, @updated_at)`,
      )
      .run({
        id,
        email: body.email,
        display_name: body.displayName,
        password_hash: hash,
        password_salt: salt,
        role: body.role,
        created_at: now,
        updated_at: now,
      });
    const row = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id)!;
    return { outcome: 'created', account: rowToAccount(row) };
  }

  /**
   * Archives a user account and immediately invalidates all their sessions.
   *
   * @param id - The ID of the account to archive
   * @returns 'archived' on success, 'not-found' if the account does not exist, or
   *   'last-admin' if archiving would leave no active administrators
   */
  archive(id: string): ArchiveResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (target.role === 'ADMIN' && target.status === 'ACTIVE' && this.activeAdminCount() <= 1) {
      return 'last-admin';
    }

    const now = new Date().toISOString();
    this.db
      .prepare(`UPDATE users SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ?`)
      .run(now, now, id);
    this.db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(id);
    return 'archived';
  }

  /**
   * Permanently deletes an archived user account and all their contract data.
   *
   * @param id - The ID of the archived account to delete
   * @returns 'deleted' on success, 'not-found' if the account does not exist, or
   *   'not-archived' if the account is still active
   */
  delete(id: string): DeleteResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (target.status !== 'ARCHIVED') return 'not-archived';

    const doDelete = this.db.transaction(() => {
      this.db.prepare(`DELETE FROM contracts WHERE user_id = ?`).run(id);
      this.db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    });
    doDelete();
    return 'deleted';
  }

  /**
   * Reactivates an archived user account.
   *
   * @param id - The ID of the archived account to reactivate
   * @returns 'reactivated' on success, 'not-found' if the account does not exist, or
   *   'not-archived' if the account is not in the archived state
   */
  reactivate(id: string): ReactivateResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (target.status !== 'ARCHIVED') return 'not-archived';

    this.db
      .prepare(
        `UPDATE users SET status = 'ACTIVE', archived_at = NULL, updated_at = ? WHERE id = ?`,
      )
      .run(new Date().toISOString(), id);
    return 'reactivated';
  }

  /**
   * Changes the role of a user account.
   *
   * @param id - The ID of the account whose role should change
   * @param role - The new role to assign
   * @returns 'changed' on success, 'not-found' if the account does not exist, or
   *   'last-admin' if downgrading would leave no active administrators
   */
  changeRole(id: string, role: Role): ChangeRoleResult {
    const target = this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id);
    if (!target) return 'not-found';
    if (
      target.role === 'ADMIN' &&
      target.status === 'ACTIVE' &&
      role !== 'ADMIN' &&
      this.activeAdminCount() <= 1
    ) {
      return 'last-admin';
    }

    this.db
      .prepare(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`)
      .run(role, new Date().toISOString(), id);
    return 'changed';
  }

  /**
   * Finds a user by email address, optionally including archived accounts.
   *
   * @param email - The email address to search for (case-insensitive)
   * @param options - Query options; set includeArchived to true to also match archived
   *   accounts
   * @returns The matching UserRow, or null if no match was found
   */
  findByEmail(email: string, options?: { includeArchived?: boolean }): UserRow | null {
    const includeArchived = options?.includeArchived ?? false;
    const query = includeArchived
      ? `SELECT * FROM users WHERE email = ? COLLATE NOCASE`
      : `SELECT * FROM users WHERE email = ? COLLATE NOCASE AND status = 'ACTIVE'`;
    return this.db.prepare<[string], UserRow>(query).get(email) ?? null;
  }

  /**
   * Creates a new active member account from an accepted invitation, deriving the display
   * name from the local part of the email address.
   *
   * @param email - The email address from the accepted invitation
   * @param password - The plaintext password chosen by the new user
   * @returns The newly inserted UserRow
   */
  activateFromInvitation(email: string, password: string): UserRow {
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const id = randomUUID();
    const displayName = email.split('@')[0] ?? email;
    this.db
      .prepare(
        `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
         VALUES (@id, @email, @display_name, @password_hash, @password_salt, 'MEMBER', 'ACTIVE', @created_at, @updated_at)`,
      )
      .run({
        id,
        email,
        display_name: displayName,
        password_hash: hash,
        password_salt: salt,
        created_at: now,
        updated_at: now,
      });
    return this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id)!;
  }

  /**
   * Creates a new active member account from an approved sign-up request, reusing its
   * already-hashed password rather than re-hashing the plaintext (which the service never
   * sees again once the request was submitted).
   *
   * @param email - The email address from the approved sign-up request
   * @param passwordHash - The pre-computed scrypt hash stored on the sign-up request
   * @param passwordSalt - The pre-computed scrypt salt stored on the sign-up request
   * @returns The newly inserted UserRow
   */
  createFromVerifiedSignup(email: string, passwordHash: string, passwordSalt: string): UserRow {
    const now = new Date().toISOString();
    const id = randomUUID();
    const displayName = email.split('@')[0] ?? email;
    this.db
      .prepare(
        `INSERT INTO users (id, email, display_name, password_hash, password_salt, role, status, created_at, updated_at)
         VALUES (@id, @email, @display_name, @password_hash, @password_salt, 'MEMBER', 'ACTIVE', @created_at, @updated_at)`,
      )
      .run({
        id,
        email,
        display_name: displayName,
        password_hash: passwordHash,
        password_salt: passwordSalt,
        created_at: now,
        updated_at: now,
      });
    return this.db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`).get(id)!;
  }

  /**
   * Returns the count of currently active administrator accounts.
   *
   * @returns The number of users with role ADMIN and status ACTIVE
   */
  private activeAdminCount(): number {
    const row = this.db
      .prepare<
        [],
        { count: number }
      >(`SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`)
      .get()!;
    return row.count;
  }
}
