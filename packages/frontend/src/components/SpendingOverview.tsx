import { useTranslation } from 'react-i18next';
import { Box, Group, Paper, Progress, SimpleGrid, Text } from '@mantine/core';
import { IconChartPie } from '@tabler/icons-react';
import type { CategorySummary } from '@pcm/shared';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import classes from './SpendingOverview.module.css';

/**
 * Dashboard card displaying total monthly spending and a breakdown by contract category with
 * a proportional progress bar.
 */

const SEGMENT_COLORS = ['blue', 'cyan', 'teal'] as const;

interface SpendingOverviewProps {
  totalMonthlySpending: number;
  contractsByCategory: CategorySummary[];
}

/**
 * Renders total monthly spending and a segmented progress bar showing per-category
 * proportions.
 *
 * @param props - totalMonthlySpending: sum of all active contract monthly costs;
 *   contractsByCategory: per-category aggregation from the dashboard API
 */
export function SpendingOverview({
  totalMonthlySpending,
  contractsByCategory,
}: SpendingOverviewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocaleFormat();

  const segments = contractsByCategory.map((cat, i) => ({
    ...cat,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
    pct: totalMonthlySpending > 0 ? (cat.monthlyTotal / totalMonthlySpending) * 100 : 0,
  }));

  const progressSegments = segments.map((seg) => (
    <Progress.Section value={seg.pct} color={seg.color} key={seg.category} aria-label={seg.label}>
      {seg.pct > 10 && <Progress.Label>{Math.round(seg.pct)}%</Progress.Label>}
    </Progress.Section>
  ));

  const statCards = segments.map((seg) => (
    <Box
      key={seg.category}
      className={classes.stat}
      style={{ borderBottomColor: `var(--mantine-color-${seg.color}-6)` }}
    >
      <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
        {seg.label}
      </Text>
      <Group justify="space-between" align="flex-end" gap={0}>
        <Text fw={700}>{formatCurrency(seg.monthlyTotal)}</Text>
        <Text c={seg.color} fw={700} size="sm" className={classes.statCount}>
          {Math.round(seg.pct)}%
        </Text>
      </Group>
    </Box>
  ));

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Group align="flex-end" gap="xs">
          <Text fz="xl" fw={700}>
            {totalMonthlySpending === 0
              ? t('dashboard.noActiveContracts')
              : formatCurrency(totalMonthlySpending)}
          </Text>
          <Text c="dimmed" fz="xs" fw={700} tt="uppercase" className={classes.label} pb={3}>
            {t('dashboard.monthlySpending')}
          </Text>
        </Group>
        <IconChartPie size={22} className={classes.icon} stroke={1.5} />
      </Group>

      <Text c="dimmed" fz="sm">
        {t('dashboard.acrossActiveContracts')}
      </Text>

      {segments.length > 0 && (
        <>
          <Progress.Root size={34} classNames={{ label: classes.progressLabel }} mt={40}>
            {progressSegments}
          </Progress.Root>
          <SimpleGrid cols={{ base: 1, xs: 3 }} mt="xl">
            {statCards}
          </SimpleGrid>
        </>
      )}
    </Paper>
  );
}
