import { describe, it, expect } from 'vitest';
import { RequestPasswordResetBodySchema, ResetPasswordBodySchema } from '../../src/schemas/auth.js';

describe('RequestPasswordResetBodySchema', () => {
  it('accepts a valid email', () => {
    const result = RequestPasswordResetBodySchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = RequestPasswordResetBodySchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = RequestPasswordResetBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ResetPasswordBodySchema', () => {
  it('accepts a password with at least 8 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({ password: '12345678' });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({ password: '1234567' });
    expect(result.success).toBe(false);
  });

  it('rejects a password longer than 200 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({ password: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = ResetPasswordBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
