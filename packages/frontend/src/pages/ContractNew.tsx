import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Title, Paper } from '@mantine/core';
import { ContractForm } from '../components/ContractForm.js';
import { useCreateContract } from '../services/contracts.js';
import { showError } from '../lib/notifications.js';

/**
 * Page for creating a new contract. Renders the ContractForm component and navigates
 * to the contract list on successful submission.
 */

/**
 * Renders the new-contract page with toast error feedback on submission failure.
 */
export function ContractNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createContract, isPending } = useCreateContract();

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Title order={2}>{t('contractNew.title')}</Title>
      <Paper withBorder radius="md" p="lg">
        <ContractForm
          onSubmit={(data) =>
            createContract(data, {
              onSuccess: () => navigate('/contracts'),
              onError: (err) => showError(err.message),
            })
          }
          onCancel={() => navigate('/contracts')}
          submitLabel={t('nav.addContract')}
          isPending={isPending}
        />
      </Paper>
    </Stack>
  );
}
