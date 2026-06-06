import { useTranslation } from 'react-i18next';
import type { ColumnMapping, TargetField } from '../utils/columnMapping.js';
import { REQUIRED_TARGET_FIELDS } from '../utils/columnMapping.js';

const ALL_TARGET_FIELDS: TargetField[] = [
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
];

const SKIP_VALUE = '__skip__';

interface ColumnMappingTableProps {
  mappings: ColumnMapping[];
  onChange: (updated: ColumnMapping[]) => void;
}

export function ColumnMappingTable({ mappings, onChange }: ColumnMappingTableProps) {
  const { t } = useTranslation();

  function handleChange(index: number, value: string) {
    const updated = mappings.map((m, i) => {
      if (i !== index) return m;
      const targetField = value === SKIP_VALUE || value === '' ? null : (value as TargetField);
      return { ...m, targetField, confidence: targetField ? 1 : 0 };
    });
    onChange(updated);
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-foreground/10 text-left">
          <th className="py-2 pr-4 font-medium">{t('import.columnHeader.source')}</th>
          <th className="py-2 font-medium">{t('import.columnHeader.target')}</th>
        </tr>
      </thead>
      <tbody>
        {mappings.map((mapping, i) => {
          const isRequired =
            mapping.targetField !== null &&
            REQUIRED_TARGET_FIELDS.includes(mapping.targetField as TargetField);
          const isMissing =
            mapping.targetField === null &&
            REQUIRED_TARGET_FIELDS.some((f) => !mappings.some((m) => m.targetField === f));

          return (
            <tr key={mapping.sourceColumn} className="border-b border-foreground/5">
              <td className="py-2 pr-4 font-mono text-xs">{mapping.sourceColumn}</td>
              <td className="py-2">
                <select
                  className={`w-full rounded border px-2 py-1 text-sm ${
                    mapping.targetField === null
                      ? isMissing
                        ? 'border-red-400 bg-red-50 text-red-800'
                        : 'border-foreground/20 text-[--color-muted-foreground]'
                      : isRequired
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-foreground/20'
                  }`}
                  value={mapping.targetField ?? SKIP_VALUE}
                  onChange={(e) => handleChange(i, e.target.value)}
                  aria-label={`${t('import.mappingSelectLabel')} ${mapping.sourceColumn}`}
                >
                  <option value={SKIP_VALUE}>{t('import.skip')}</option>
                  <option value="" disabled>
                    ─── {t('import.fields')} ───
                  </option>
                  {ALL_TARGET_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {field}
                      {REQUIRED_TARGET_FIELDS.includes(field) ? ' *' : ''}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
