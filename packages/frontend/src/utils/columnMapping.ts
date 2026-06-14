/**
 * Utilities for mapping imported CSV/Excel column headers to contract fields using
 * a synonym-based confidence scoring system.
 */

export interface ImportResult {
  total: number;
  created: number;
  failed: Array<{ rowIndex: number; message: string }>;
}

export type TargetField =
  | 'name'
  | 'category'
  | 'amount'
  | 'billingInterval'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'details'
  | 'serviceUrl'
  | 'cancellationPeriod.value'
  | 'cancellationPeriod.unit'
  | 'anonymize';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: TargetField | null;
  confidence: number;
}

export const REQUIRED_TARGET_FIELDS: readonly TargetField[] = [
  'name',
  'category',
  'amount',
  'billingInterval',
];

const SYSTEM_FIELDS = new Set(['id', 'createdat', 'created at', 'updatedat', 'updated at']);

const SYNONYM_TABLE: Record<string, TargetField> = {
  name: 'name',
  'contract name': 'name',
  title: 'name',
  label: 'name',
  service: 'name',
  'service name': 'name',

  category: 'category',
  type: 'category',
  kind: 'category',
  group: 'category',

  amount: 'amount',
  cost: 'amount',
  price: 'amount',
  fee: 'amount',
  'monthly cost': 'amount',
  payment: 'amount',
  value: 'amount',
  charge: 'amount',

  billinginterval: 'billingInterval',
  'billing interval': 'billingInterval',
  'billing frequency': 'billingInterval',
  frequency: 'billingInterval',
  interval: 'billingInterval',
  'payment cycle': 'billingInterval',
  period: 'billingInterval',
  'billing period': 'billingInterval',

  status: 'status',
  state: 'status',
  'active status': 'status',
  'contract status': 'status',

  startdate: 'startDate',
  'start date': 'startDate',
  start: 'startDate',
  begin: 'startDate',
  from: 'startDate',
  'from date': 'startDate',
  'contract start': 'startDate',
  'start on': 'startDate',

  enddate: 'endDate',
  'end date': 'endDate',
  end: 'endDate',
  until: 'endDate',
  expiry: 'endDate',
  expiration: 'endDate',
  to: 'endDate',
  'to date': 'endDate',
  'renewal date': 'endDate',
  'contract end': 'endDate',
  'valid until': 'endDate',

  details: 'details',
  notes: 'details',
  description: 'details',
  comments: 'details',
  note: 'details',
  'additional info': 'details',
  memo: 'details',

  serviceurl: 'serviceUrl',
  'service url': 'serviceUrl',
  url: 'serviceUrl',
  website: 'serviceUrl',
  link: 'serviceUrl',
  'web address': 'serviceUrl',
  'service link': 'serviceUrl',
  homepage: 'serviceUrl',

  'cancellationperiod.value': 'cancellationPeriod.value',
  'cancellation period value': 'cancellationPeriod.value',
  'notice period value': 'cancellationPeriod.value',
  'cancellation value': 'cancellationPeriod.value',
  'notice value': 'cancellationPeriod.value',
  'notice period': 'cancellationPeriod.value',

  'cancellationperiod.unit': 'cancellationPeriod.unit',
  'cancellation period unit': 'cancellationPeriod.unit',
  'notice period unit': 'cancellationPeriod.unit',
  'cancellation unit': 'cancellationPeriod.unit',
  'notice unit': 'cancellationPeriod.unit',

  anonymize: 'anonymize',
  anonymous: 'anonymize',
  hide: 'anonymize',
  private: 'anonymize',
  hidden: 'anonymize',
};

/**
 * Normalizes a column header by trimming whitespace, lowercasing, and collapsing
 * internal whitespace.
 *
 * @param column - the raw column header string
 * @returns the normalized lowercase column name
 */
export function normalizeColumn(column: string): string {
  return column.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Infers a single column mapping by matching the normalized source column against the
 * synonym table. System fields (id, createdat, etc.) are excluded from mapping.
 *
 * @param sourceColumn - the raw column header from the imported file
 * @returns a ColumnMapping with the matched target field and confidence score
 */
export function inferMapping(sourceColumn: string): ColumnMapping {
  const normalized = normalizeColumn(sourceColumn);

  if (SYSTEM_FIELDS.has(normalized)) {
    return { sourceColumn, targetField: null, confidence: 0 };
  }

  const match = SYNONYM_TABLE[normalized];
  if (match !== undefined) {
    return { sourceColumn, targetField: match, confidence: 1 };
  }

  return { sourceColumn, targetField: null, confidence: 0 };
}

/**
 * Batch-infers mappings for all source columns in a file.
 *
 * @param columns - array of raw column headers from the imported file
 * @returns array of inferred ColumnMapping objects
 */
export function inferMappings(columns: string[]): ColumnMapping[] {
  return columns.map(inferMapping);
}

/**
 * Checks whether all required target fields have been mapped.
 *
 * @param mappings - the current column mappings
 * @returns true if every required field (name, category, amount, billingInterval) is present
 */
export function isMappingComplete(mappings: ColumnMapping[]): boolean {
  const mappedFields = new Set(
    mappings.filter((m) => m.targetField !== null).map((m) => m.targetField),
  );
  return REQUIRED_TARGET_FIELDS.every((f) => mappedFields.has(f));
}
