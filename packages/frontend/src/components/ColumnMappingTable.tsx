import { useTranslation } from 'react-i18next';
import { Table, NativeSelect, Code } from '@mantine/core';
import type { ColumnMapping, TargetField } from '../utils/columnMapping.js';
import { REQUIRED_TARGET_FIELDS } from '../utils/columnMapping.js';

/**
 * Table component for mapping source file columns to contract field targets during the import
 * flow.
 */

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

/**
 * Renders a two-column table where users assign each source file column to a target contract
 * field or skip it.
 *
 * @param props - mappings: current column-to-field mapping state; onChange: called with the
 *   updated mappings when a select value changes
 */
export function ColumnMappingTable({ mappings, onChange }: ColumnMappingTableProps) {
  const { t } = useTranslation();

  /**
   * Updates the target field for a single mapping row.
   *
   * @param index - Index of the mapping entry to update
   * @param value - The selected target field value, or the skip sentinel
   */
  function handleChange(index: number, value: string) {
    const updated = mappings.map((m, i) => {
      if (i !== index) return m;
      const targetField = value === SKIP_VALUE || value === '' ? null : (value as TargetField);
      return { ...m, targetField, confidence: targetField ? 1 : 0 };
    });
    onChange(updated);
  }

  return (
    <Table withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('import.columnHeader.source')}</Table.Th>
          <Table.Th>{t('import.columnHeader.target')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {mappings.map((mapping, i) => {
          const isRequired =
            mapping.targetField !== null &&
            REQUIRED_TARGET_FIELDS.includes(mapping.targetField as TargetField);
          const isMissing =
            mapping.targetField === null &&
            REQUIRED_TARGET_FIELDS.some((f) => !mappings.some((m) => m.targetField === f));

          return (
            <Table.Tr key={mapping.sourceColumn}>
              <Table.Td>
                <Code>{mapping.sourceColumn}</Code>
              </Table.Td>
              <Table.Td>
                <NativeSelect
                  size="xs"
                  value={mapping.targetField ?? SKIP_VALUE}
                  onChange={(e) => handleChange(i, e.target.value)}
                  aria-label={`${t('import.mappingSelectLabel')} ${mapping.sourceColumn}`}
                  styles={{
                    input: {
                      borderColor: isMissing
                        ? 'var(--mantine-color-red-6)'
                        : isRequired
                          ? 'var(--mantine-color-blue-6)'
                          : undefined,
                    },
                  }}
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
                </NativeSelect>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
