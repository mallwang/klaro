import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Group, Title, Button, Center, Text, Paper } from '@mantine/core';
import { useContracts, useDeleteContract } from '../services/contracts.js';
import { ContractTable } from '../components/ContractTable.js';
import { AnonymizationToggle } from '../components/AnonymizationToggle.js';
import { ExportMenu } from '../components/ExportMenu.js';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { showError } from '../lib/notifications.js';

/**
 * Contract list page displaying all user contracts in a sortable table with anonymization
 * toggle, export, and import actions.
 */

/**
 * Renders the contract list page with delete and load error feedback as toast notifications.
 */
export function ContractList() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useContracts();
  const { mutate: deleteContract } = useDeleteContract();
  const { isAnonymized, toggleAnonymization, getDisplayName } = useAnonymization();

  useEffect(() => {
    if (isError) showError(t('contractList.loadError'));
  }, [isError, t]);

  return (
    <Stack gap="lg" maw={900} mx="auto">
      <Group justify="space-between" align="flex-end">
        <Title order={2}>{t('contractList.title')}</Title>
        <Group gap="xs">
          <AnonymizationToggle isActive={isAnonymized} onToggle={toggleAnonymization} />
          {data && <ExportMenu contracts={data} />}
          <Button component={Link} to="/contracts/import" variant="default" size="sm">
            {t('import.linkLabel')}
          </Button>
          <Button component={Link} to="/contracts/new" size="sm">
            {t('nav.addContract')}
          </Button>
        </Group>
      </Group>

      {isLoading && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}

      {data && (
        <Paper withBorder>
          <ContractTable
            contracts={data}
            onDelete={(id) =>
              deleteContract(id, {
                onError: () => showError(t('contractList.deleteError')),
              })
            }
            isAnonymized={isAnonymized}
            getDisplayName={getDisplayName}
          />
        </Paper>
      )}
    </Stack>
  );
}
