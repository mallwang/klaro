import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import type { ContractData } from '@pcm/shared';
import { exportToJson, exportToExcel } from '../services/export.js';

interface ExportMenuProps {
  contracts: ContractData[];
}

export function ExportMenu({ contracts }: ExportMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border border-foreground/20 bg-background px-3 py-2 text-sm font-medium hover:bg-foreground/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={14} />
        {t('export.buttonLabel')}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-1 min-w-[10rem] rounded border border-foreground/10 bg-background shadow-md"
        >
          <button
            role="menuitem"
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
            onClick={() => {
              exportToJson(contracts);
              setOpen(false);
            }}
          >
            {t('export.toJson')}
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-foreground/5"
            onClick={() => {
              exportToExcel(contracts);
              setOpen(false);
            }}
          >
            {t('export.toExcel')}
          </button>
        </div>
      )}
    </div>
  );
}
