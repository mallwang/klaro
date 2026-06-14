import * as XLSX from 'xlsx';
import type { ContractData } from '@pcm/shared';

/**
 * Utilities for exporting the contract list to JSON or Excel (XLSX) file downloads.
 */

export const EXCEL_COLUMNS = [
  'id',
  'name',
  'category',
  'amount',
  'billingInterval',
  'status',
  'startDate',
  'endDate',
  'details',
  'serviceUrl',
  'cancellationPeriod.value',
  'cancellationPeriod.unit',
  'anonymize',
  'createdAt',
  'updatedAt',
] as const;

type ExcelRow = Record<string, string | number | boolean | null>;

/**
 * Returns the contracts array as-is for use as the JSON export payload.
 *
 * @param contracts - The contracts to export
 * @returns The same array, suitable for JSON serialization
 */
export function buildJsonExport(contracts: ContractData[]): ContractData[] {
  return contracts;
}

/**
 * Maps an array of ContractData objects to flat Excel row records keyed by column name.
 *
 * @param contracts - The contracts to convert
 * @returns An array of flat row objects compatible with the XLSX sheet builder
 */
export function buildExcelRows(contracts: ContractData[]): ExcelRow[] {
  return contracts.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    amount: c.amount,
    billingInterval: c.billingInterval,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
    details: c.details,
    serviceUrl: c.serviceUrl,
    'cancellationPeriod.value': c.cancellationPeriod?.value ?? null,
    'cancellationPeriod.unit': c.cancellationPeriod?.unit ?? null,
    anonymize: c.anonymize,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * Returns today's date as a YYYY-MM-DD string for use in export filenames.
 *
 * @returns ISO date string for the current local date
 */
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Triggers a browser file download for the given Blob.
 *
 * @param blob - File contents to download
 * @param filename - The suggested filename shown in the browser's save dialog
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Serializes the contract list to a JSON file and triggers a browser download.
 *
 * @param contracts - The contracts to export
 */
export function exportToJson(contracts: ContractData[]): void {
  const data = buildJsonExport(contracts);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `contracts-${todayString()}.json`);
}

/**
 * Serializes the contract list to an XLSX workbook and triggers a browser download.
 *
 * @param contracts - The contracts to export
 */
export function exportToExcel(contracts: ContractData[]): void {
  const rows = buildExcelRows(contracts);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_COLUMNS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `contracts-${todayString()}.xlsx`);
}
