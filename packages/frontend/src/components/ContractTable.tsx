import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import { Table, Text, Group, Button, Center, Pagination, Box, Card, Stack } from '@mantine/core';
import type { ContractData } from '@pcm/shared';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import { CategoryIcon } from './CategoryIcon.js';
import { ProviderLogo } from './ProviderLogo.js';
import classes from './ContractTable.module.css';

/**
 * Sortable, compact contract table displaying name, category, amount, status, end date, and
 * action buttons. Long names truncate with an ellipsis. Action buttons match the Manage
 * Accounts page style (compact-sm, default variant). Supports client-side sorting and an
 * anonymization flip animation.
 */

type SortColumn = 'name' | 'category' | 'amount' | 'status' | 'endDate';
type SortDirection = 'asc' | 'desc';

interface SortState {
  column: SortColumn | null;
  direction: SortDirection | null;
}

interface ContractTableProps {
  contracts: ContractData[];
  onDelete: (id: string) => void;
  isAnonymized?: boolean;
  getDisplayName?: (contract: ContractData) => string;
}

function SortIcon({ col, sortState }: Readonly<{ col: SortColumn; sortState: SortState }>) {
  if (sortState.column === col) {
    return sortState.direction === 'asc' ? (
      <IconChevronUp
        role="img"
        aria-label="Sorted ascending"
        size={14}
        className={classes.sortIconActive}
      />
    ) : (
      <IconChevronDown
        role="img"
        aria-label="Sorted descending"
        size={14}
        className={classes.sortIconActive}
      />
    );
  }
  return <IconSelector role="img" aria-label="Sort" size={14} className={classes.sortIcon} />;
}

/**
 * Renders a compact, sortable table of contracts with delete confirmation, anonymization
 * support, and locale-aware currency/date formatting. Long contract names are truncated with
 * an ellipsis. Action buttons use the same compact-sm default-variant style as Manage Accounts.
 *
 * @param props.contracts - array of contract data to display
 * @param props.onDelete - callback invoked with the contract ID when deletion is confirmed
 * @param props.isAnonymized - whether contract names should be displayed anonymized
 * @param props.getDisplayName - optional function to resolve a display name for anonymized contracts
 */
export function ContractTable({
  contracts,
  onDelete,
  isAnonymized = false,
  getDisplayName,
}: Readonly<ContractTableProps>) {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocaleFormat();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const sortedContracts = (() => {
    const col = sortState.column ?? 'name';
    const dir = sortState.direction === 'desc' ? -1 : 1;
    return [...contracts].sort((a, b) => {
      switch (col) {
        case 'name':
          return dir * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        case 'category':
          return dir * a.category.localeCompare(b.category);
        case 'amount':
          return dir * (a.amount - b.amount);
        case 'status':
          return dir * a.status.localeCompare(b.status);
        case 'endDate':
          return dir * (a.endDate ?? '9999-99-99').localeCompare(b.endDate ?? '9999-99-99');
      }
    });
  })();

  const totalPages = Math.ceil(sortedContracts.length / PAGE_SIZE);
  const pagedContracts = sortedContracts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /**
   * Handles column sort toggling and resets pagination to page 1.
   *
   * @param col - the column to sort by
   */
  function handleSort(col: SortColumn) {
    setSortState((prev) => {
      if (prev.column !== col) return { column: col, direction: 'asc' };
      if (prev.direction === 'asc') return { column: col, direction: 'desc' };
      return { column: null, direction: null };
    });
    setCurrentPage(1);
  }

  const [displayAnonymized, setDisplayAnonymized] = useState(isAnonymized);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevAnonymized = useRef(isAnonymized);

  useEffect(() => {
    if (prevAnonymized.current === isAnonymized) return;
    prevAnonymized.current = isAnonymized;

    setIsFlipping(true);
    const swapTimer = setTimeout(() => {
      setDisplayAnonymized(isAnonymized);
    }, 200);
    const endTimer = setTimeout(() => {
      setIsFlipping(false);
    }, 400);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
    };
  }, [isAnonymized]);

  function resolveName(contract: ContractData): string {
    if (displayAnonymized || contract.anonymize) {
      return getDisplayName ? getDisplayName(contract) : contract.name;
    }
    return contract.name;
  }

  if (contracts.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">{t('contractList.noContracts')}</Text>
      </Center>
    );
  }

  return (
    <>
      {/* Card list — mobile only */}
      <Box hiddenFrom="sm">
        <Stack gap="sm">
          {pagedContracts.map((contract) => (
            <Card key={contract.id} withBorder padding="sm" radius="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  <div className={`${classes.nameCell}${isFlipping ? ' animate-name-flip' : ''}`}>
                    {contract.useGenericIcon ? (
                      <ProviderLogo name="" isAnonymized size={24} />
                    ) : (
                      <ProviderLogo
                        name={contract.logoName ?? contract.name}
                        isAnonymized={displayAnonymized || contract.anonymize}
                        size={24}
                      />
                    )}
                    <Text size="sm" fw={600} truncate="end">
                      {resolveName(contract)}
                    </Text>
                  </div>
                </Group>
                <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                  {formatCurrency(contract.amount)}
                  {' / '}
                  {t(`billingInterval.${contract.billingInterval}`)}
                </Text>
              </Group>
              <Group gap="xs" mt={6}>
                <div className={classes.categoryCell}>
                  <CategoryIcon category={contract.category} size={14} />
                  <Text size="xs" c="dimmed">
                    {t(`category.${contract.category}`)}
                  </Text>
                </div>
                <Text size="xs" c="dimmed">
                  ·
                </Text>
                <Text size="xs" c="dimmed">
                  {t(`status.${contract.status}`)}
                </Text>
                <Text size="xs" c="dimmed">
                  ·
                </Text>
                <Text size="xs" c="dimmed">
                  {contract.endDate ? formatDate(contract.endDate) : t('common.noData')}
                </Text>
              </Group>
              <Group gap="xs" mt="sm">
                {pendingDeleteId === contract.id ? (
                  <>
                    <Button
                      size="compact-sm"
                      color="red"
                      variant="filled"
                      onClick={() => {
                        onDelete(contract.id);
                        setPendingDeleteId(null);
                      }}
                    >
                      {t('common.confirm')}
                    </Button>
                    <Button
                      size="compact-sm"
                      variant="default"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="compact-sm"
                      variant="default"
                      component={Link}
                      to={`/contracts/${contract.id}/edit`}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="compact-sm"
                      variant="default"
                      onClick={() => setPendingDeleteId(contract.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Full table — tablet and desktop */}
      <Box visibleFrom="sm">
        <Table.ScrollContainer minWidth={600}>
          <Table
            stickyHeader
            withTableBorder
            withColumnBorders={false}
            highlightOnHover
            verticalSpacing="xs"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th className={classes.th} onClick={() => handleSort('name')}>
                  <div className={classes.thInner}>
                    {t('contractList.nameColumn')}
                    <SortIcon col="name" sortState={sortState} />
                  </div>
                </Table.Th>
                <Table.Th className={classes.th} onClick={() => handleSort('category')}>
                  <div className={classes.thInner}>
                    {t('contractList.categoryColumn')}
                    <SortIcon col="category" sortState={sortState} />
                  </div>
                </Table.Th>
                <Table.Th className={classes.th} onClick={() => handleSort('amount')}>
                  <div className={classes.thInner}>
                    {t('contractList.amountColumn')}
                    <SortIcon col="amount" sortState={sortState} />
                  </div>
                </Table.Th>
                <Table.Th className={classes.th} onClick={() => handleSort('status')}>
                  <div className={classes.thInner}>
                    {t('contractList.statusColumn')}
                    <SortIcon col="status" sortState={sortState} />
                  </div>
                </Table.Th>
                <Table.Th className={classes.th} onClick={() => handleSort('endDate')}>
                  <div className={classes.thInner}>
                    {t('contractList.endDateColumn')}
                    <SortIcon col="endDate" sortState={sortState} />
                  </div>
                </Table.Th>
                <Table.Th className={classes.thActions}>{t('contractList.actionsColumn')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedContracts.map((contract) => (
                <Table.Tr key={contract.id}>
                  <Table.Td>
                    <div className={`${classes.nameCell}${isFlipping ? ' animate-name-flip' : ''}`}>
                      {contract.useGenericIcon ? (
                        <ProviderLogo name="" isAnonymized size={20} />
                      ) : (
                        <ProviderLogo
                          name={contract.logoName ?? contract.name}
                          isAnonymized={displayAnonymized || contract.anonymize}
                          size={20}
                        />
                      )}
                      <Text size="sm" fw={500} truncate="end">
                        {resolveName(contract)}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div className={classes.categoryCell}>
                      <CategoryIcon category={contract.category} size={16} />
                      {t(`category.${contract.category}`)}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {formatCurrency(contract.amount)}
                    {' / '}
                    {t(`billingInterval.${contract.billingInterval}`)}
                  </Table.Td>
                  <Table.Td>{t(`status.${contract.status}`)}</Table.Td>
                  <Table.Td>
                    {contract.endDate ? formatDate(contract.endDate) : t('common.noData')}
                  </Table.Td>
                  <Table.Td>
                    {pendingDeleteId === contract.id ? (
                      <Group gap="xs">
                        <Button
                          size="compact-sm"
                          color="red"
                          variant="filled"
                          onClick={() => {
                            onDelete(contract.id);
                            setPendingDeleteId(null);
                          }}
                        >
                          {t('common.confirm')}
                        </Button>
                        <Button
                          size="compact-sm"
                          variant="default"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          {t('common.cancel')}
                        </Button>
                      </Group>
                    ) : (
                      <Group gap="xs">
                        <Button
                          size="compact-sm"
                          variant="default"
                          component={Link}
                          to={`/contracts/${contract.id}/edit`}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="compact-sm"
                          variant="default"
                          onClick={() => setPendingDeleteId(contract.id)}
                        >
                          {t('common.delete')}
                        </Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Box>

      {totalPages > 1 && (
        <Group justify="center" py="sm">
          <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} size="sm" />
        </Group>
      )}
    </>
  );
}
