import { useTranslation } from 'react-i18next';
import type { UpcomingRenewal } from '@pcm/shared';
import { CalendarClock } from 'lucide-react';
import { Paper, Group, Title, Text, Badge, Stack } from '@mantine/core';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { getFantasyName, FANTASY_NAMES } from '../data/fantasyNames.js';
import classes from './UpcomingRenewals.module.css';

/**
 * Dashboard card listing contracts with upcoming cancellation deadlines, colour-coded by
 * urgency.
 */

interface UpcomingRenewalsProps {
  upcomingRenewals: UpcomingRenewal[];
}

/**
 * Maps the number of days remaining until a cancellation deadline to a Mantine colour token.
 *
 * @param days - Days until (positive) or since (negative) the cancellation deadline
 * @returns "red" when overdue, "orange" within 7 days, otherwise "gray"
 */
function urgencyColor(days: number): string {
  if (days < 0) return 'red';
  if (days <= 7) return 'orange';
  return 'gray';
}

/**
 * Renders a colour-coded urgency badge for a cancellation deadline.
 *
 * @param props - days: days remaining until (or since) the cancellation deadline
 */
function UrgencyBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  const color = urgencyColor(days);
  let label: string;
  if (days < 0) {
    label = t('dashboard.daysOverdue', { count: Math.abs(days) });
  } else if (days === 0) {
    label = t('dashboard.dueToday');
  } else {
    label = t('dashboard.daysRemaining', { count: days });
  }
  return (
    <Badge color={color} size="sm" data-testid="urgency-badge">
      {label}
    </Badge>
  );
}

/**
 * Renders a dashboard card listing upcoming contract renewals with cancellation deadlines
 * and urgency indicators, respecting the global anonymization toggle.
 *
 * @param props - upcomingRenewals: list of upcoming renewal summaries from the dashboard API
 */
export function UpcomingRenewals({ upcomingRenewals }: UpcomingRenewalsProps) {
  const { t } = useTranslation();
  const { formatDate } = useLocaleFormat();
  const { isAnonymized } = useAnonymization();

  /**
   * Returns the display name for an upcoming renewal, applying anonymization when active.
   *
   * @param renewal - The upcoming renewal to resolve a name for
   * @returns The renewal name or its fantasy alias
   */
  function resolveName(renewal: UpcomingRenewal): string {
    if (isAnonymized || renewal.anonymize) {
      return getFantasyName(renewal.id, FANTASY_NAMES);
    }
    return renewal.name;
  }

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>{t('dashboard.upcomingRenewals')}</Title>
        <CalendarClock size={16} color="var(--mantine-color-dimmed)" />
      </Group>
      {upcomingRenewals.length === 0 ? (
        <Text size="sm" c="dimmed" className="upcoming-renewals__empty">
          {t('dashboard.noRenewals')}
        </Text>
      ) : (
        <Stack gap={0} className="upcoming-renewals__list">
          {upcomingRenewals.map((renewal) => (
            <div
              key={renewal.id}
              data-overdue={renewal.daysUntilCancellationDeadline < 0 ? 'true' : 'false'}
              className={`${classes.item} upcoming-renewals__item`}
            >
              <Stack gap={2}>
                <Text size="sm" fw={500} className="upcoming-renewals__name">
                  {resolveName(renewal)}
                </Text>
                <Text size="xs" c="dimmed" className="upcoming-renewals__category">
                  {t(`category.${renewal.category}`)}
                </Text>
                <Text size="xs" c="dimmed" className="upcoming-renewals__cancel-by-label">
                  {t('dashboard.cancelBy')}: {formatDate(renewal.cancellationDeadline)}
                </Text>
                <Text size="xs" c="dimmed" className="upcoming-renewals__ends-on-label">
                  {t('dashboard.endsOn')}: {formatDate(renewal.endDate)}
                </Text>
              </Stack>
              <UrgencyBadge days={renewal.daysUntilCancellationDeadline} />
            </div>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
