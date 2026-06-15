import { describe, it, expect } from 'vitest';
import { UpdateNotificationPreferencesBodySchema } from '@pcm/shared';

/**
 * Tests for the UpdateNotificationPreferencesBodySchema Zod schema.
 */

describe('UpdateNotificationPreferencesBodySchema', () => {
  it('rejects enabled=true without a frequency', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects enabled=true with a null frequency', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: true,
      summaryEmailFrequency: null,
    });
    expect(result.success).toBe(false);
  });

  it('accepts enabled=true with frequency WEEKLY', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: true,
      summaryEmailFrequency: 'WEEKLY',
    });
    expect(result.success).toBe(true);
  });

  it('accepts enabled=true with frequency MONTHLY', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: true,
      summaryEmailFrequency: 'MONTHLY',
    });
    expect(result.success).toBe(true);
  });

  it('accepts enabled=false without a frequency', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts enabled=false with a provided frequency', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
      summaryEmailFrequency: 'WEEKLY',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown frequency value', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: true,
      summaryEmailFrequency: 'DAILY',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing summaryEmailEnabled', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailFrequency: 'WEEKLY',
    });
    expect(result.success).toBe(false);
  });
});
