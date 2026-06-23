import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { InactiveContract } from '@pcm/shared';
import { Accordion, Group, Text, Badge, Stack, Title } from '@mantine/core';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { getFantasyName, FANTASY_NAMES } from '../data/fantasyNames.js';
import { ProviderLogo } from './ProviderLogo.js';
import classes from './InactiveContracts.module.css';

/**
 * Dashboard section listing the user's deactivated contracts in a collapsed-by-default,
 * visually muted accordion so they don't compete for attention with actionable sections.
 */

interface InactiveContractsProps {
  inactiveContracts: InactiveContract[];
}

/**
 * Renders a collapsed-by-default accordion listing inactive contracts, respecting the global
 * anonymization toggle. Renders nothing when there are no inactive contracts.
 *
 * @param props - inactiveContracts: list of inactive contract summaries from the dashboard API
 */
export function InactiveContracts({ inactiveContracts }: InactiveContractsProps) {
  const { t } = useTranslation();
  const { isAnonymized } = useAnonymization();

  if (inactiveContracts.length === 0) {
    return null;
  }

  /**
   * Returns the display name for an inactive contract, applying anonymization when active.
   *
   * @param contract - The inactive contract to resolve a name for
   * @returns The contract name or its fantasy alias
   */
  function resolveName(contract: InactiveContract): string {
    if (isAnonymized || contract.anonymize) {
      return getFantasyName(contract.id, FANTASY_NAMES);
    }
    return contract.name;
  }

  return (
    <Accordion chevronPosition="right" variant="separated" className={classes.accordion}>
      <Accordion.Item value="inactive-contracts">
        <Accordion.Control>
          <Group gap="xs">
            <Title order={4} c="dimmed">
              {t('dashboard.inactiveContracts')}
            </Title>
            <Badge color="gray" size="sm" variant="light">
              {inactiveContracts.length}
            </Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap={0} style={{ maxHeight: '16rem', overflowY: 'auto' }}>
            {inactiveContracts.map((contract) => (
              <Link
                key={contract.id}
                to={`/contracts/${contract.id}/edit`}
                className={classes.item}
              >
                <Group gap="xs" align="center" style={{ flex: 1, minWidth: 0 }}>
                  <ProviderLogo
                    name={contract.useGenericIcon ? '' : (contract.logoName ?? contract.name)}
                    isAnonymized={contract.useGenericIcon || isAnonymized || contract.anonymize}
                    size={20}
                  />
                  <div>
                    <Text size="sm" fw={500} c="dimmed">
                      {resolveName(contract)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t(`category.${contract.category}`)}
                    </Text>
                  </div>
                </Group>
              </Link>
            ))}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
