import * as XLSX from 'xlsx';
import type { ContractData } from '@pcm/shared';

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

export function buildJsonExport(contracts: ContractData[]): ContractData[] {
  return contracts;
}

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

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

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

export function exportToJson(contracts: ContractData[]): void {
  const data = buildJsonExport(contracts);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `contracts-${todayString()}.json`);
}

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
