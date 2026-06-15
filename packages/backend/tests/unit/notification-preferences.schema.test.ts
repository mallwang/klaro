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

  it('accepts emailLanguage "en"', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
      emailLanguage: 'en',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.emailLanguage).toBe('en');
  });

  it('accepts emailLanguage "de"', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
      emailLanguage: 'de',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.emailLanguage).toBe('de');
  });

  it('rejects an unknown emailLanguage value', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
      emailLanguage: 'it',
    });
    expect(result.success).toBe(false);
  });

  it('accepts body without emailLanguage (field is optional)', () => {
    const result = UpdateNotificationPreferencesBodySchema.safeParse({
      summaryEmailEnabled: false,
    });
    expect(result.success).toBe(true);
  });
});
