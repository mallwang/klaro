import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Cryptographic utilities for password hashing and verification using scrypt.
 */

const KEY_LENGTH = 64;

export interface PasswordHash {
  hash: string;
  salt: string;
}

/**
 * Derives a scrypt hash from the given plaintext password with a random salt.
 *
 * @param password - The plaintext password to hash
 * @returns An object containing the hex-encoded hash and the hex-encoded salt
 */
export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return { hash, salt };
}

/**
 * Verifies a plaintext password against a stored hash and salt using a timing-safe
 * comparison.
 *
 * @param password - The plaintext password to verify
 * @param hash - The hex-encoded stored hash
 * @param salt - The hex-encoded salt used when the hash was created
 * @returns True if the password matches; false otherwise
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/**
 * Generates a random URL-safe initial password for newly created accounts.
 *
 * @returns A 16-character base64url-encoded random string
 */
export function generateInitialPassword(): string {
  return randomBytes(12).toString('base64url');
}
