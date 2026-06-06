import { describe, it, expect, vi } from 'vitest';
import {
  parseJsonFile,
  buildCreateContractBody,
  runImport,
} from '../../src/services/importParsing.js';
import type { ColumnMapping } from '../../src/utils/columnMapping.js';
import type { CreateContractBody } from '@pcm/shared';

function makeFile(content: string, name = 'test.json', type = 'application/json'): File {
  return new File([content], name, { type });
}

const requiredMappings: ColumnMapping[] = [
  { sourceColumn: 'name', targetField: 'name', confidence: 1 },
  { sourceColumn: 'amount', targetField: 'amount', confidence: 1 },
  { sourceColumn: 'billingInterval', targetField: 'billingInterval', confidence: 1 },
  { sourceColumn: 'category', targetField: 'category', confidence: 1 },
];

describe('parseJsonFile', () => {
  it('parses a valid JSON array into columns and rows', async () => {
    const json = JSON.stringify([{ name: 'Netflix', amount: 15.99 }]);
    const result = await parseJsonFile(makeFile(json));
    expect(result.columns).toContain('name');
    expect(result.columns).toContain('amount');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.['name']).toBe('Netflix');
    expect(result.rows[0]?.['amount']).toBe('15.99');
  });

  it('returns empty rows for empty array', async () => {
    const result = await parseJsonFile(makeFile('[]'));
    expect(result.rows).toHaveLength(0);
    expect(result.columns).toHaveLength(0);
  });

  it('coerces all cell values to strings', async () => {
    const json = JSON.stringify([{ amount: 9.99, active: true, count: 3 }]);
    const result = await parseJsonFile(makeFile(json));
    expect(result.rows[0]?.['amount']).toBe('9.99');
    expect(result.rows[0]?.['active']).toBe('true');
    expect(result.rows[0]?.['count']).toBe('3');
  });

  it('rejects a file larger than 5 MB', async () => {
    const bigContent = 'x'.repeat(5 * 1024 * 1024 + 1);
    await expect(parseJsonFile(makeFile(bigContent))).rejects.toThrow(/5 MB/);
  });

  it('rejects invalid JSON', async () => {
    await expect(parseJsonFile(makeFile('not json'))).rejects.toThrow();
  });

  it('rejects non-array JSON', async () => {
    await expect(parseJsonFile(makeFile('{"a":1}'))).rejects.toThrow(/array/i);
  });
});

describe('buildCreateContractBody', () => {
  const row: Record<string, string> = {
    name: 'Netflix',
    amount: '15.99',
    billingInterval: 'MONTHLY',
    category: 'SUBSCRIPTIONS',
  };

  it('builds a valid CreateContractBody from a fully mapped row', () => {
    const result = buildCreateContractBody(row, requiredMappings);
    expect(result instanceof Error).toBe(false);
    const body = result as CreateContractBody;
    expect(body.name).toBe('Netflix');
    expect(body.amount).toBe(15.99);
    expect(body.billingInterval).toBe('MONTHLY');
    expect(body.category).toBe('SUBSCRIPTIONS');
  });

  it('normalises category and billingInterval to uppercase', () => {
    const body = buildCreateContractBody(
      { ...row, category: 'subscriptions', billingInterval: 'monthly' },
      requiredMappings,
    ) as CreateContractBody;
    expect(body.category).toBe('SUBSCRIPTIONS');
    expect(body.billingInterval).toBe('MONTHLY');
  });

  it('returns Error when required field name is missing', () => {
    const mappings = requiredMappings.filter((m) => m.targetField !== 'name');
    const result = buildCreateContractBody(row, mappings);
    expect(result instanceof Error).toBe(true);
  });

  it('assembles cancellationPeriod from two mapped columns', () => {
    const mappings: ColumnMapping[] = [
      ...requiredMappings,
      { sourceColumn: 'cp_value', targetField: 'cancellationPeriod.value', confidence: 1 },
      { sourceColumn: 'cp_unit', targetField: 'cancellationPeriod.unit', confidence: 1 },
    ];
    const rowWithCP: Record<string, string> = {
      ...row,
      cp_value: '3',
      cp_unit: 'MONTHS',
    };
    const body = buildCreateContractBody(rowWithCP, mappings) as CreateContractBody;
    expect(body.cancellationPeriod).toEqual({ value: 3, unit: 'MONTHS' });
  });

  it('sets cancellationPeriod to null when only value is provided', () => {
    const mappings: ColumnMapping[] = [
      ...requiredMappings,
      { sourceColumn: 'cp_value', targetField: 'cancellationPeriod.value', confidence: 1 },
    ];
    const rowWithCP: Record<string, string> = { ...row, cp_value: '3' };
    const body = buildCreateContractBody(rowWithCP, mappings) as CreateContractBody;
    expect(body.cancellationPeriod).toBeUndefined();
  });

  it('normalises anonymize: "true" → true, "1" → true, "false" → false', () => {
    const mappings: ColumnMapping[] = [
      ...requiredMappings,
      { sourceColumn: 'anonymize', targetField: 'anonymize', confidence: 1 },
    ];
    const body1 = buildCreateContractBody(
      { ...row, anonymize: 'true' },
      mappings,
    ) as CreateContractBody;
    expect(body1.anonymize).toBe(true);
    const body2 = buildCreateContractBody(
      { ...row, anonymize: '1' },
      mappings,
    ) as CreateContractBody;
    expect(body2.anonymize).toBe(true);
    const body3 = buildCreateContractBody(
      { ...row, anonymize: 'false' },
      mappings,
    ) as CreateContractBody;
    expect(body3.anonymize).toBe(false);
  });

  it('skips columns mapped to null targetField', () => {
    const mappings: ColumnMapping[] = [
      ...requiredMappings,
      { sourceColumn: 'Vendor', targetField: null, confidence: 0 },
    ];
    const body = buildCreateContractBody(
      { ...row, Vendor: 'ignored' },
      mappings,
    ) as CreateContractBody;
    expect(body).not.toHaveProperty('Vendor');
  });
});

describe('runImport', () => {
  it('calls createFn once per valid row and returns created count', async () => {
    const createFn = vi.fn().mockResolvedValue(undefined);
    const rows = [{ name: 'A', amount: '1', billingInterval: 'MONTHLY', category: 'OTHER' }];
    const result = await runImport(rows, requiredMappings, createFn);
    expect(createFn).toHaveBeenCalledOnce();
    expect(result.total).toBe(1);
    expect(result.created).toBe(1);
    expect(result.failed).toHaveLength(0);
  });

  it('captures failed rows without stopping the import', async () => {
    const createFn = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('API error'));
    const rows = [
      { name: 'Good', amount: '1', billingInterval: 'MONTHLY', category: 'OTHER' },
      { name: 'Bad', amount: 'not-a-number', billingInterval: 'MONTHLY', category: 'OTHER' },
    ];

    const mappings: ColumnMapping[] = [...requiredMappings];

    const result = await runImport(rows, mappings, createFn);
    expect(result.total).toBe(2);
    expect(result.created).toBe(1);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]?.rowIndex).toBe(2);
  });

  it('returns all failed when createFn always throws', async () => {
    const createFn = vi.fn().mockRejectedValue(new Error('Network down'));
    const rows = [
      { name: 'A', amount: '1', billingInterval: 'MONTHLY', category: 'OTHER' },
      { name: 'B', amount: '2', billingInterval: 'YEARLY', category: 'UTILITIES' },
    ];
    const result = await runImport(rows, requiredMappings, createFn);
    expect(result.failed).toHaveLength(2);
    expect(result.created).toBe(0);
  });
});
