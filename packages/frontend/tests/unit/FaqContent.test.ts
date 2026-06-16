import { describe, it, expect } from 'vitest';
import en from '../../src/i18n/locales/en.json';
import de from '../../src/i18n/locales/de.json';

interface FaqEntry {
  question: string;
  answer: string;
}

describe('FAQ content structure', () => {
  it('en.json has a faq.items array', () => {
    expect(Array.isArray(en.faq.items)).toBe(true);
  });

  it('de.json has a faq.items array', () => {
    expect(Array.isArray(de.faq.items)).toBe(true);
  });

  it('faq.items arrays in en.json and de.json have the same length', () => {
    expect(en.faq.items.length).toBe(de.faq.items.length);
  });

  it('en.json faq.items has between 1 and 10 entries', () => {
    expect(en.faq.items.length).toBeGreaterThanOrEqual(1);
    expect(en.faq.items.length).toBeLessThanOrEqual(10);
  });

  it('every en.json faq entry has a non-empty question and answer', () => {
    (en.faq.items as FaqEntry[]).forEach((entry, index) => {
      expect(entry.question, `en item ${index} question`).toBeTruthy();
      expect(entry.answer, `en item ${index} answer`).toBeTruthy();
    });
  });

  it('every de.json faq entry has a non-empty question and answer', () => {
    (de.faq.items as FaqEntry[]).forEach((entry, index) => {
      expect(entry.question, `de item ${index} question`).toBeTruthy();
      expect(entry.answer, `de item ${index} answer`).toBeTruthy();
    });
  });

  it('en.json has a non-empty faq.title', () => {
    expect(en.faq.title).toBeTruthy();
  });

  it('de.json has a non-empty faq.title', () => {
    expect(de.faq.title).toBeTruthy();
  });
});
