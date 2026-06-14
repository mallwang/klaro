import * as XLSX from 'xlsx';
import type { CreateContractBody } from '@pcm/shared';
import type { ColumnMapping, TargetField } from '../utils/columnMapping.js';
import type { ImportResult } from '../utils/columnMapping.js';

/**
 * File parsing and row transformation utilities for importing contracts from JSON or Excel
 * files.
 */

export interface ParsedImportFile {
  columns: string[];
  rows: Array<Record<string, string>>;
  warnings: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Converts an arbitrary cell value to a string, returning an empty string for null/undefined.
 *
 * @param value - Raw cell value from the parsed file
 * @returns String representation of the value
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Reads a File as a UTF-8 text string using the FileReader API.
 *
 * @param file - The file to read
 * @returns The file contents as a string
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Reads a File as an ArrayBuffer using the FileReader API.
 *
 * @param file - The file to read
 * @returns The file contents as an ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses a JSON file and extracts a flat list of row objects with string cell values.
 *
 * @param file - A JSON file containing an array of objects
 * @returns The discovered column names, normalized string rows, and any parse warnings
 */
export async function parseJsonFile(file: File): Promise<ParsedImportFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 5 MB size limit.');
  }
  const text = await readFileAsText(file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Invalid JSON: could not parse the file.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: expected a JSON array of objects.');
  }
  if (parsed.length === 0) {
    return { columns: [], rows: [], warnings: [] };
  }
  const columns = Array.from(
    new Set(
      parsed.flatMap((row) =>
        typeof row === 'object' && row !== null ? Object.keys(row as object) : [],
      ),
    ),
  );
  const rows = parsed.map((row) => {
    const obj = typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {};
    return Object.fromEntries(columns.map((col) => [col, cellToString(obj[col])]));
  });
  return { columns, rows, warnings: [] };
}

/**
 * Parses an Excel (XLSX) file and extracts rows from the first worksheet.
 *
 * @param file - An XLSX file; only the first sheet is used when multiple sheets are present
 * @returns The discovered column names, normalized string rows, and any parse warnings
 */
export async function parseExcelFile(file: File): Promise<ParsedImportFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 5 MB size limit.');
  }
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const warnings: string[] = [];
  if (workbook.SheetNames.length > 1) {
    warnings.push('Multiple sheets detected; using the first sheet only.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no sheets.');
  }
  const worksheet = workbook.Sheets[sheetName]!;
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: null });
  if (rawRows.length === 0) {
    return { columns: [], rows: [], warnings };
  }
  const columns = Object.keys(rawRows[0]!);
  const rows = rawRows.map((row) =>
    Object.fromEntries(columns.map((col) => [col, cellToString(row[col])])),
  );
  return { columns, rows, warnings };
}

/**
 * Parses a numeric amount string, accepting either decimal comma or decimal point notation.
 *
 * @param value - Raw amount string from the import row
 * @returns The parsed non-negative number, or an Error describing the validation failure
 */
function parseAmount(value: string): number | Error {
  const n = parseFloat(value.replace(',', '.'));
  if (isNaN(n) || n < 0) return new Error(`Invalid amount: "${value}"`);
  return n;
}

/**
 * Converts a string cell value to a boolean, treating "true", "1", and "yes" as truthy.
 *
 * @param value - Raw boolean string from the import row
 * @returns The boolean interpretation of the value
 */
function parseBool(value: string): boolean {
  return ['true', '1', 'yes'].includes(value.toLowerCase().trim());
}

/**
 * Transforms a flat import row into a CreateContractBody using the provided column mappings.
 *
 * @param row - A single row of string cell values keyed by source column name
 * @param mappings - The user-configured column-to-field mappings
 * @returns A validated CreateContractBody, or an Error describing the first validation failure
 */
export function buildCreateContractBody(
  row: Record<string, string>,
  mappings: ColumnMapping[],
): CreateContractBody | Error {
  const get = (field: TargetField): string | undefined => {
    const mapping = mappings.find((m) => m.targetField === field);
    if (!mapping) return undefined;
    return row[mapping.sourceColumn];
  };

  const name = get('name');
  if (!name || name.trim() === '') return new Error('Missing required field: name');

  const rawAmount = get('amount');
  if (rawAmount === undefined || rawAmount === '')
    return new Error('Missing required field: amount');
  const amount = parseAmount(rawAmount);
  if (amount instanceof Error) return amount;

  const billingInterval = (
    get('billingInterval') ?? ''
  ).toUpperCase() as CreateContractBody['billingInterval'];
  if (!billingInterval) return new Error('Missing required field: billingInterval');

  const category = (get('category') ?? '').toUpperCase() as CreateContractBody['category'];
  if (!category) return new Error('Missing required field: category');

  const body: CreateContractBody = {
    name: name.trim(),
    amount,
    billingInterval,
    category,
    status: 'ACTIVE',
  };

  const status = get('status');
  if (status) body.status = status.toUpperCase() as CreateContractBody['status'];

  const startDate = get('startDate');
  if (startDate) body.startDate = startDate;

  const endDate = get('endDate');
  if (endDate) body.endDate = endDate;

  const details = get('details');
  if (details) body.details = details;

  const serviceUrl = get('serviceUrl');
  if (serviceUrl) body.serviceUrl = serviceUrl;

  const cpValue = get('cancellationPeriod.value');
  const cpUnit = get('cancellationPeriod.unit');
  if (cpValue && cpUnit) {
    const val = parseInt(cpValue, 10);
    if (!isNaN(val)) {
      body.cancellationPeriod = {
        value: val,
        unit: cpUnit.toUpperCase() as 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS',
      };
    }
  }

  const anonymize = get('anonymize');
  if (anonymize !== undefined) body.anonymize = parseBool(anonymize);

  return body;
}

/**
 * Iterates over import rows, builds a CreateContractBody for each, and calls the provided
 * create function, collecting per-row errors without aborting the entire import.
 *
 * @param rows - The parsed import rows to process
 * @param mappings - Column-to-field mappings to apply when building each body
 * @param createFn - Async function that persists a single contract; called once per valid row
 * @returns A summary of how many rows were created and which rows failed
 */
export async function runImport(
  rows: Array<Record<string, string>>,
  mappings: ColumnMapping[],
  createFn: (body: CreateContractBody) => Promise<unknown>,
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, created: 0, failed: [] };

  for (let i = 0; i < rows.length; i++) {
    const rowIndex = i + 1;
    const bodyOrError = buildCreateContractBody(rows[i]!, mappings);
    if (bodyOrError instanceof Error) {
      result.failed.push({ rowIndex, message: bodyOrError.message });
      continue;
    }
    try {
      await createFn(bodyOrError);
      result.created++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.failed.push({ rowIndex, message });
    }
  }

  return result;
}
