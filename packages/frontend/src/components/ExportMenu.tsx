import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Menu, Button } from '@mantine/core';
import type { ContractData } from '@pcm/shared';
import { exportToJson, exportToExcel } from '../services/export.js';

/**
 * Dropdown menu component for exporting the contract list to JSON or Excel.
 */

interface ExportMenuProps {
  contracts: ContractData[];
}

/**
 * Renders a dropdown export button that triggers a JSON or XLSX file download.
 *
 * @param props - contracts: the contract list to include in the export
 */
export function ExportMenu({ contracts }: ExportMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <Button variant="default" leftSection={<Download size={14} />} size="sm">
          {t('export.buttonLabel')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => exportToJson(contracts)}>{t('export.toJson')}</Menu.Item>
        <Menu.Item onClick={() => exportToExcel(contracts)}>{t('export.toExcel')}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
