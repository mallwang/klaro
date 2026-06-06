import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import type { ColumnMapping, ImportResult } from '../utils/columnMapping.js';
import { inferMappings, isMappingComplete } from '../utils/columnMapping.js';
import { parseJsonFile, parseExcelFile, runImport } from '../services/importParsing.js';
import type { ParsedImportFile } from '../services/importParsing.js';
import { ColumnMappingTable } from '../components/ColumnMappingTable.js';
import { ImportResultSummary } from '../components/ImportResultSummary.js';
import { useCreateContract } from '../services/contracts.js';

type Stage = 'idle' | 'parsing' | 'mapping' | 'importing' | 'done';

export function ContractImport() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedImportFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { mutateAsync: createContract } = useCreateContract();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStage('parsing');

    try {
      let result: ParsedImportFile;
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        result = await parseJsonFile(file);
      } else {
        result = await parseExcelFile(file);
      }
      setParsed(result);
      setMappings(inferMappings(result.columns));
      setStage('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('import.parseError'));
      setStage('idle');
    }
  }

  async function handleConfirm() {
    if (!parsed || !isMappingComplete(mappings)) return;
    setStage('importing');
    const result = await runImport(parsed.rows, mappings, (body) => createContract(body));
    setImportResult(result);
    setStage('done');
  }

  function handleReset() {
    setStage('idle');
    setError(null);
    setParsed(null);
    setMappings([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const canConfirm = stage === 'mapping' && isMappingComplete(mappings);

  return (
    <div className="min-h-screen bg-[--color-muted] p-6">
      <main className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('import.title')}</h1>
          <p className="text-sm text-[--color-muted-foreground]">
            <Link to="/contracts" className="hover:underline">
              {t('nav.backToContracts')}
            </Link>
          </p>
        </header>

        {stage === 'idle' && (
          <div className="rounded-lg bg-background p-6 shadow-sm">
            {error && (
              <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-foreground/20 p-8 hover:bg-foreground/5">
              <Upload size={32} className="text-[--color-muted-foreground]" />
              <span className="text-sm font-medium">{t('import.uploadLabel')}</span>
              <span className="text-xs text-[--color-muted-foreground]">
                {t('import.uploadHint')}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xlsx"
                className="sr-only"
                aria-label={t('import.fileInputLabel')}
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}

        {stage === 'parsing' && (
          <p className="py-8 text-center text-[--color-muted-foreground]">{t('common.loading')}</p>
        )}

        {stage === 'mapping' && parsed && (
          <div className="rounded-lg bg-background p-6 shadow-sm">
            {parsed.warnings.map((w) => (
              <p
                key={w}
                className="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {w}
              </p>
            ))}
            <p className="mb-4 text-sm text-[--color-muted-foreground]">
              {t('import.mappingHint', { count: parsed.rows.length })}
            </p>
            <ColumnMappingTable mappings={mappings} onChange={setMappings} />
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!canConfirm}
                className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('common.confirm')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                {t('common.cancel')}
              </button>
              {!canConfirm && (
                <p className="text-xs text-red-600">{t('import.requiredFieldsMissing')}</p>
              )}
            </div>
          </div>
        )}

        {stage === 'importing' && (
          <p className="py-8 text-center text-[--color-muted-foreground]">
            {t('import.importing')}
          </p>
        )}

        {stage === 'done' && importResult && (
          <div className="rounded-lg bg-background p-6 shadow-sm">
            <ImportResultSummary result={importResult} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
}
