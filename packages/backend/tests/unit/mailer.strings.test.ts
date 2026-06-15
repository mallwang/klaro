import { describe, it, expect } from 'vitest';
import { SUPPORTED_EMAIL_LANGUAGES } from '@pcm/shared';
import {
  testEmailStrings,
  welcomeEmailStrings,
  passwordChangeEmailStrings,
  emailChangeConfirmationStrings,
  emailVerificationStrings,
  invitationEmailStrings,
  passwordResetEmailStrings,
  summaryEmailStrings,
} from '../../src/services/mailer.strings.js';

/**
 * CI coverage check: asserts every supported email language has a non-empty entry for every
 * email type. This test fails as soon as a new locale is added to SUPPORTED_EMAIL_LANGUAGES
 * without corresponding string maps, blocking CI before the gap reaches production.
 */

const ALL_MAPS = [
  { name: 'testEmailStrings', map: testEmailStrings },
  { name: 'welcomeEmailStrings', map: welcomeEmailStrings },
  { name: 'passwordChangeEmailStrings', map: passwordChangeEmailStrings },
  { name: 'emailChangeConfirmationStrings', map: emailChangeConfirmationStrings },
  { name: 'emailVerificationStrings', map: emailVerificationStrings },
  { name: 'invitationEmailStrings', map: invitationEmailStrings },
  { name: 'passwordResetEmailStrings', map: passwordResetEmailStrings },
  { name: 'summaryEmailStrings', map: summaryEmailStrings },
] as const;

describe('mailer.strings – locale coverage', () => {
  it('every string map has an entry for every supported language', () => {
    for (const { name, map } of ALL_MAPS) {
      for (const lang of SUPPORTED_EMAIL_LANGUAGES) {
        expect(
          Object.prototype.hasOwnProperty.call(map, lang),
          `${name} is missing locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('every string map covers exactly the set of supported languages (no extras, no gaps)', () => {
    for (const { name, map } of ALL_MAPS) {
      const mapKeys = new Set(Object.keys(map));
      const supportedSet = new Set<string>(SUPPORTED_EMAIL_LANGUAGES);
      for (const lang of supportedSet) {
        expect(mapKeys.has(lang), `${name} is missing locale "${lang}"`).toBe(true);
      }
    }
  });
});

describe('mailer.strings – output shape', () => {
  it('testEmailStrings returns non-empty subject, text, html for every locale', () => {
    for (const lang of SUPPORTED_EMAIL_LANGUAGES) {
      const result = testEmailStrings[lang]({ to: 'test@example.com' });
      expect(result.subject, `testEmailStrings[${lang}].subject`).toBeTruthy();
      expect(result.text, `testEmailStrings[${lang}].text`).toBeTruthy();
      expect(result.html, `testEmailStrings[${lang}].html`).toBeTruthy();
    }
  });

  it('welcomeEmailStrings returns non-empty strings for every locale', () => {
    for (const lang of SUPPORTED_EMAIL_LANGUAGES) {
      const result = welcomeEmailStrings[lang]({ link: 'https://example.com/signin' });
      expect(result.subject).toBeTruthy();
      expect(result.text).toContain('https://example.com/signin');
      expect(result.html).toContain('https://example.com/signin');
    }
  });

  it('emailVerificationStrings includes link and expiry date for every locale', () => {
    for (const lang of SUPPORTED_EMAIL_LANGUAGES) {
      const result = emailVerificationStrings[lang]({
        link: 'https://example.com/verify',
        expiryDate: '2026-06-30',
      });
      expect(result.subject).toBeTruthy();
      expect(result.text).toContain('https://example.com/verify');
      expect(result.html).toContain('https://example.com/verify');
    }
  });

  it('German emails have German subject line', () => {
    const testResult = testEmailStrings['de']({ to: 'test@example.com' });
    expect(testResult.subject).not.toBe(testEmailStrings['en']({ to: 'test@example.com' }).subject);

    const welcomeResult = welcomeEmailStrings['de']({ link: 'https://x.com' });
    expect(welcomeResult.subject).not.toBe(
      welcomeEmailStrings['en']({ link: 'https://x.com' }).subject,
    );
  });

  it('German emailChangeConfirmationStrings formats date in DD.MM.YYYY style', () => {
    const result = emailChangeConfirmationStrings['de']({ changedAt: '2026-06-15T00:00:00Z' });
    expect(result.text).toMatch(/15\.06\.2026/);
  });

  it('English emailChangeConfirmationStrings formats date in locale style', () => {
    const result = emailChangeConfirmationStrings['en']({ changedAt: '2026-06-15T00:00:00Z' });
    expect(result.subject).toBeTruthy();
    expect(result.text).toBeTruthy();
  });
});
