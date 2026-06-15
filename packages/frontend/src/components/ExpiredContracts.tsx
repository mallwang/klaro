import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ExpiredContract } from '@pcm/shared';
import { AlertTriangle } from 'lucide-react';
import { Paper, Group, Title, Text, Badge, Stack } from '@mantine/core';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import { getFantasyName, FANTASY_NAMES } from '../data/fantasyNames.js';
import { ProviderLogo } from './ProviderLogo.js';
import classes from './ExpiredContracts.module.css';

/**
 * Dashboard card listing contracts whose end date has passed, with a per-item overdue day
 * count and links to the contract edit page.
 */

interface ExpiredContractsProps {
  expiredContracts: ExpiredContract[];
}

/**
 * Renders a card listing expired contracts with their end dates and overdue counts,
 * respecting the global anonymization toggle.
 *
 * @param props - expiredContracts: list of expired contract summaries from the dashboard API
 */
export function ExpiredContracts({ expiredContracts }: ExpiredContractsProps) {
  const { t } = useTranslation();
  const { isAnonymized } = useAnonymization();
  const { formatDate } = useLocaleFormat();
  const hasExpired = expiredContracts.length > 0;

  /**
   * Returns the display name for an expired contract, applying anonymization when active.
   *
   * @param contract - The expired contract to resolve a name for
   * @returns The contract name or its fantasy alias
   */
  function resolveName(contract: ExpiredContract): string {
    if (isAnonymized || contract.anonymize) {
      return getFantasyName(contract.id, FANTASY_NAMES);
    }
    return contract.name;
  }

  return (
    <Paper withBorder radius="md" p="md" className={hasExpired ? classes.amberCard : undefined}>
      <Group justify="space-between" mb="sm">
        <Title order={4}>{t('dashboard.expiredContracts')}</Title>
        <AlertTriangle
          size={16}
          color={hasExpired ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-dimmed)'}
        />
      </Group>
      {!hasExpired ? (
        <Text size="sm" c="dimmed" className="expired-contracts__empty">
          {t('dashboard.noExpiredContracts')}
        </Text>
      ) : (
        <Stack
          gap={0}
          className="expired-contracts__list"
          style={{ maxHeight: '16rem', overflowY: 'auto' }}
        >
          {expiredContracts.map((contract) => (
            <Link
              key={contract.id}
              to={`/contracts/${contract.id}/edit`}
              className={`${classes.item} expired-contracts__item`}
            >
              <Group gap="xs" align="center" style={{ flex: 1, minWidth: 0 }}>
                <ProviderLogo
                  name={contract.useGenericIcon ? '' : (contract.logoName ?? contract.name)}
                  isAnonymized={contract.useGenericIcon || isAnonymized || contract.anonymize}
                  size={20}
                />
                <div>
                  <Text size="sm" fw={500} className="expired-contracts__name">
                    {resolveName(contract)}
                  </Text>
                  <Text size="xs" c="dimmed" className="expired-contracts__category">
                    {t(`category.${contract.category}`)}
                  </Text>
                </div>
              </Group>
              <Stack gap={4} align="flex-end">
                <Text size="xs" c="dimmed" className="expired-contracts__date">
                  {formatDate(contract.endDate)}
                </Text>
                <Badge color="orange" size="sm">
                  {t('dashboard.daysOverdue', { count: contract.daysOverdue })}
                </Badge>
              </Stack>
            </Link>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
