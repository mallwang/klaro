import { useTranslation } from 'react-i18next';
import type { ImportResult } from '../utils/columnMapping.js';

interface ImportResultSummaryProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportResultSummary({ result, onReset }: ImportResultSummaryProps) {
  const { t } = useTranslation();
  const allOk = result.failed.length === 0;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-4 ${allOk ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}
      >
        <p className="font-medium">
          {t('import.result.summary', {
            total: result.total,
            created: result.created,
            failed: result.failed.length,
          })}
        </p>
        <ul className="mt-1 text-sm">
          <li>
            {t('import.result.total')}: <strong>{result.total}</strong>
          </li>
          <li className="text-green-700">
            {t('import.result.created')}: <strong>{result.created}</strong>
          </li>
          {result.failed.length > 0 && (
            <li className="text-red-700">
              {t('import.result.failed')}: <strong>{result.failed.length}</strong>
            </li>
          )}
        </ul>
      </div>

      {result.failed.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-red-700">{t('import.result.errors')}</h3>
          <ul className="space-y-1 text-sm">
            {result.failed.map(({ rowIndex, message }) => (
              <li key={rowIndex} className="rounded border border-red-200 bg-red-50 px-3 py-1.5">
                <span className="font-mono font-medium">
                  {t('import.result.row')} {rowIndex}:
                </span>{' '}
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="rounded border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
      >
        {t('import.result.importAnother')}
      </button>
    </div>
  );
}
