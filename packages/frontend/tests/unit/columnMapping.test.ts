import { describe, it, expect } from 'vitest';
import {
  normalizeColumn,
  inferMapping,
  inferMappings,
  isMappingComplete,
  REQUIRED_TARGET_FIELDS,
} from '../../src/utils/columnMapping.js';

describe('normalizeColumn', () => {
  it('trims whitespace and lowercases', () => {
    expect(normalizeColumn('  Contract Name  ')).toBe('contract name');
  });

  it('collapses multiple internal spaces', () => {
    expect(normalizeColumn('Billing  Interval')).toBe('billing interval');
  });

  it('handles already-normalised input', () => {
    expect(normalizeColumn('name')).toBe('name');
  });
});

describe('inferMapping — exact synonyms', () => {
  it('maps "name" (exact) to name field', () => {
    const m = inferMapping('name');
    expect(m.targetField).toBe('name');
    expect(m.confidence).toBe(1);
  });

  it('maps "Contract Name" (case-insensitive) to name field', () => {
    expect(inferMapping('Contract Name').targetField).toBe('name');
  });

  it('maps "Monthly Cost" to amount', () => {
    expect(inferMapping('Monthly Cost').targetField).toBe('amount');
  });

  it('maps "Billing Frequency" to billingInterval', () => {
    expect(inferMapping('Billing Frequency').targetField).toBe('billingInterval');
  });

  it('maps "Start Date" to startDate', () => {
    expect(inferMapping('Start Date').targetField).toBe('startDate');
  });

  it('maps "End Date" to endDate', () => {
    expect(inferMapping('End Date').targetField).toBe('endDate');
  });

  it('maps "Notes" to details', () => {
    expect(inferMapping('Notes').targetField).toBe('details');
  });

  it('maps "Website" to serviceUrl', () => {
    expect(inferMapping('Website').targetField).toBe('serviceUrl');
  });

  it('maps "Cancellation Period Value" to cancellationPeriod.value', () => {
    expect(inferMapping('Cancellation Period Value').targetField).toBe('cancellationPeriod.value');
  });

  it('maps "Cancellation Period Unit" to cancellationPeriod.unit', () => {
    expect(inferMapping('Cancellation Period Unit').targetField).toBe('cancellationPeriod.unit');
  });

  it('maps "Anonymize" to anonymize', () => {
    expect(inferMapping('Anonymize').targetField).toBe('anonymize');
  });

  it('maps "Type" to category', () => {
    expect(inferMapping('Type').targetField).toBe('category');
  });
});

describe('inferMapping — unknown and system columns', () => {
  it('returns null targetField for completely unknown column', () => {
    const m = inferMapping('Vendor Contact');
    expect(m.targetField).toBeNull();
    expect(m.confidence).toBe(0);
  });

  it('returns null for system field "id"', () => {
    expect(inferMapping('id').targetField).toBeNull();
  });

  it('returns null for system field "createdAt" (normalised)', () => {
    expect(inferMapping('createdAt').targetField).toBeNull();
  });

  it('returns null for system field "updatedAt" (normalised)', () => {
    expect(inferMapping('updatedAt').targetField).toBeNull();
  });

  it('returns null for "created at" (space form)', () => {
    expect(inferMapping('Created At').targetField).toBeNull();
  });

  it('preserves original sourceColumn string in result', () => {
    const m = inferMapping('  Contract Name  ');
    expect(m.sourceColumn).toBe('  Contract Name  ');
  });
});

describe('inferMappings', () => {
  it('maps an array of columns', () => {
    const result = inferMappings(['Contract Name', 'Monthly Cost', 'Billing Frequency']);
    expect(result).toHaveLength(3);
    expect(result[0]?.targetField).toBe('name');
    expect(result[1]?.targetField).toBe('amount');
    expect(result[2]?.targetField).toBe('billingInterval');
  });

  it('returns empty array for empty input', () => {
    expect(inferMappings([])).toHaveLength(0);
  });
});

describe('REQUIRED_TARGET_FIELDS', () => {
  it('includes name, category, amount, billingInterval', () => {
    expect(REQUIRED_TARGET_FIELDS).toContain('name');
    expect(REQUIRED_TARGET_FIELDS).toContain('category');
    expect(REQUIRED_TARGET_FIELDS).toContain('amount');
    expect(REQUIRED_TARGET_FIELDS).toContain('billingInterval');
  });
});

describe('isMappingComplete', () => {
  const allRequired = REQUIRED_TARGET_FIELDS.map((f) => ({
    sourceColumn: f,
    targetField: f,
    confidence: 1,
  }));

  it('returns true when all required fields are mapped', () => {
    expect(isMappingComplete(allRequired)).toBe(true);
  });

  it('returns false when name is missing', () => {
    const mappings = allRequired.filter((m) => m.targetField !== 'name');
    expect(isMappingComplete(mappings)).toBe(false);
  });

  it('returns false when amount is missing', () => {
    const mappings = allRequired.filter((m) => m.targetField !== 'amount');
    expect(isMappingComplete(mappings)).toBe(false);
  });

  it('returns false for empty mapping list', () => {
    expect(isMappingComplete([])).toBe(false);
  });

  it('ignores extra non-required fields', () => {
    const mappings = [
      ...allRequired,
      { sourceColumn: 'Notes', targetField: 'details' as const, confidence: 1 },
    ];
    expect(isMappingComplete(mappings)).toBe(true);
  });

  it('does not count null targetFields toward required', () => {
    const mappings = allRequired.map((m) =>
      m.targetField === 'name' ? { ...m, targetField: null } : m,
    );
    expect(isMappingComplete(mappings)).toBe(false);
  });
});
