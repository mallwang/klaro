import { useTranslation } from 'react-i18next';
import type { UpcomingRenewal } from '@pcm/shared';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Badge } from './ui/badge.js';
import { useLocaleFormat } from '../hooks/useLocaleFormat.js';
import { useAnonymization } from '../hooks/useAnonymization.js';
import { getFantasyName, FANTASY_NAMES } from '../data/fantasyNames.js';

interface UpcomingRenewalsProps {
  upcomingRenewals: UpcomingRenewal[];
}

function urgencyVariant(days: number): 'destructive' | 'warning' | 'secondary' {
  if (days < 0) return 'destructive';
  if (days <= 7) return 'warning';
  return 'secondary';
}

function UrgencyBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  const variant = urgencyVariant(days);
  let label: string;
  if (days < 0) {
    label = t('dashboard.daysOverdue', { count: Math.abs(days) });
  } else if (days === 0) {
    label = t('dashboard.dueToday');
  } else {
    label = t('dashboard.daysRemaining', { count: days });
  }
  return (
    <Badge variant={variant} data-testid="urgency-badge">
      {label}
    </Badge>
  );
}

export function UpcomingRenewals({ upcomingRenewals }: UpcomingRenewalsProps) {
  const { t } = useTranslation();
  const { formatDate } = useLocaleFormat();
  const { isAnonymized } = useAnonymization();

  function resolveName(renewal: UpcomingRenewal): string {
    if (isAnonymized || renewal.anonymize) {
      return getFantasyName(renewal.id, FANTASY_NAMES);
    }
    return renewal.name;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{t('dashboard.upcomingRenewals')}</CardTitle>
        <CalendarClock className="h-4 w-4 text-[--color-muted-foreground]" />
      </CardHeader>
      <CardContent>
        {upcomingRenewals.length === 0 ? (
          <p className="upcoming-renewals__empty text-sm text-[--color-muted-foreground]">
            {t('dashboard.noRenewals')}
          </p>
        ) : (
          <ul className="upcoming-renewals__list divide-y divide-[--color-border]">
            {upcomingRenewals.map((renewal) => (
              <li
                key={renewal.id}
                data-overdue={renewal.daysUntilCancellationDeadline < 0 ? 'true' : 'false'}
                className="upcoming-renewals__item flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="upcoming-renewals__name font-medium">
                    {resolveName(renewal)}
                  </span>
                  <span className="upcoming-renewals__category text-xs text-[--color-muted-foreground]">
                    {t(`category.${renewal.category}`)}
                  </span>
                  <span className="upcoming-renewals__cancel-by-label text-xs text-[--color-muted-foreground]">
                    {t('dashboard.cancelBy')}: {formatDate(renewal.cancellationDeadline)}
                  </span>
                  <span className="upcoming-renewals__ends-on-label text-xs text-[--color-muted-foreground]">
                    {t('dashboard.endsOn')}: {formatDate(renewal.endDate)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <UrgencyBadge days={renewal.daysUntilCancellationDeadline} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
