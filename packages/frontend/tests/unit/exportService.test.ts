import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildJsonExport,
  buildExcelRows,
  EXCEL_COLUMNS,
  exportToJson,
  exportToExcel,
} from '../../src/services/export.js';
import type { ContractData } from '@pcm/shared';

const base: ContractData = {
  id: 'test-uuid',
  name: 'Netflix',
  category: 'SUBSCRIPTIONS',
  amount: 15.99,
  billingInterval: 'MONTHLY',
  status: 'ACTIVE',
  startDate: '2023-01-01',
  endDate: '2024-12-31',
  details: 'Streaming service',
  serviceUrl: 'https://netflix.com',
  cancellationPeriod: { value: 1, unit: 'MONTHS' },
  anonymize: false,
  logoName: null,
  useGenericIcon: false,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-06-01T00:00:00.000Z',
};

const minimal: ContractData = {
  id: 'min-uuid',
  name: 'Gym',
  category: 'OTHER',
  amount: 0,
  billingInterval: 'YEARLY',
  status: 'INACTIVE',
  startDate: null,
  endDate: null,
  details: null,
  serviceUrl: null,
  cancellationPeriod: null,
  anonymize: true,
  logoName: null,
  useGenericIcon: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('buildJsonExport', () => {
  it('returns an array of ContractData in original shape', () => {
    const result = buildJsonExport([base]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(base);
  });

  it('preserves nested cancellationPeriod', () => {
    const result = buildJsonExport([base]);
    expect(result[0]?.cancellationPeriod).toEqual({ value: 1, unit: 'MONTHS' });
  });

  it('returns empty array for empty input', () => {
    expect(buildJsonExport([])).toHaveLength(0);
  });

  it('keeps null cancellationPeriod as null', () => {
    const result = buildJsonExport([minimal]);
    expect(result[0]?.cancellationPeriod).toBeNull();
  });
});

describe('EXCEL_COLUMNS', () => {
  it('contains all required column headers in order', () => {
    expect(EXCEL_COLUMNS).toContain('id');
    expect(EXCEL_COLUMNS).toContain('name');
    expect(EXCEL_COLUMNS).toContain('category');
    expect(EXCEL_COLUMNS).toContain('amount');
    expect(EXCEL_COLUMNS).toContain('billingInterval');
    expect(EXCEL_COLUMNS).toContain('status');
    expect(EXCEL_COLUMNS).toContain('startDate');
    expect(EXCEL_COLUMNS).toContain('endDate');
    expect(EXCEL_COLUMNS).toContain('details');
    expect(EXCEL_COLUMNS).toContain('serviceUrl');
    expect(EXCEL_COLUMNS).toContain('cancellationPeriod.value');
    expect(EXCEL_COLUMNS).toContain('cancellationPeriod.unit');
    expect(EXCEL_COLUMNS).toContain('anonymize');
    expect(EXCEL_COLUMNS).toContain('createdAt');
    expect(EXCEL_COLUMNS).toContain('updatedAt');
  });

  it('has exactly 15 columns', () => {
    expect(EXCEL_COLUMNS).toHaveLength(15);
  });
});

describe('buildExcelRows', () => {
  it('flattens cancellationPeriod into two columns', () => {
    const rows = buildExcelRows([base]);
    expect(rows[0]?.['cancellationPeriod.value']).toBe(1);
    expect(rows[0]?.['cancellationPeriod.unit']).toBe('MONTHS');
  });

  it('sets cancellationPeriod columns to null when period is null', () => {
    const rows = buildExcelRows([minimal]);
    expect(rows[0]?.['cancellationPeriod.value']).toBeNull();
    expect(rows[0]?.['cancellationPeriod.unit']).toBeNull();
  });

  it('includes all scalar fields unchanged', () => {
    const rows = buildExcelRows([base]);
    const row = rows[0]!;
    expect(row['id']).toBe('test-uuid');
    expect(row['name']).toBe('Netflix');
    expect(row['amount']).toBe(15.99);
    expect(row['billingInterval']).toBe('MONTHLY');
    expect(row['anonymize']).toBe(false);
    expect(row['startDate']).toBe('2023-01-01');
    expect(row['endDate']).toBe('2024-12-31');
  });

  it('sets nullable fields to null when absent', () => {
    const rows = buildExcelRows([minimal]);
    const row = rows[0]!;
    expect(row['startDate']).toBeNull();
    expect(row['endDate']).toBeNull();
    expect(row['details']).toBeNull();
    expect(row['serviceUrl']).toBeNull();
  });

  it('returns one row per contract', () => {
    const rows = buildExcelRows([base, minimal]);
    expect(rows).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(buildExcelRows([])).toHaveLength(0);
  });
});

describe('download trigger', () => {
  beforeEach(() => {
    const mockClick = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exportToJson calls createObjectURL and triggers click', () => {
    exportToJson([base]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('exportToExcel calls createObjectURL and triggers click', () => {
    exportToExcel([base]);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});
