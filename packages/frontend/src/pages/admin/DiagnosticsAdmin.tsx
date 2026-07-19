import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack, Title, Text, Paper, Table, Badge, Center } from '@mantine/core';
import type { CheckResult, CheckStatus } from '@pcm/shared';
import { useDiagnostics } from '../../hooks/useDiagnostics.js';

/**
 * Admin page displaying the diagnostics report: application/database/runtime versions and a
 * set of live environment/connectivity checks, grouped into "Versions", "System Checks", and
 * "Environment Variables" sections. Consumes the same `GET /api/admin/diagnostics` endpoint as
 * the no-JS HTML fallback at `/admin/diagnostics`.
 */

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: 'green',
  warning: 'yellow',
  failed: 'red',
  'timed-out': 'red',
};

/**
 * Renders a coloured badge for a check status.
 *
 * @param status - the check outcome
 * @returns a Mantine Badge element
 */
function StatusBadge({ status }: Readonly<{ status: CheckStatus }>) {
  return (
    <Badge color={STATUS_COLOR[status]} variant="light">
      {status}
    </Badge>
  );
}

/**
 * Renders a single labeled table row, with an optional status badge for CheckResult fields.
 *
 * @param label - the field's human-readable label
 * @param detail - the value to display
 * @param status - optional check status shown as a badge
 */
function DiagnosticRow({
  label,
  detail,
  status,
}: Readonly<{ label: string; detail: string; status?: CheckStatus }>) {
  return (
    <Table.Tr>
      <Table.Th>{label}</Table.Th>
      <Table.Td>{detail}</Table.Td>
      <Table.Td>{status && <StatusBadge status={status} />}</Table.Td>
    </Table.Tr>
  );
}

/**
 * Renders a table row for a CheckResult field, shorthand for DiagnosticRow.
 *
 * @param label - the field's human-readable label
 * @param result - the check result to render
 */
function CheckRow({ label, result }: Readonly<{ label: string; result: CheckResult }>) {
  return <DiagnosticRow label={label} detail={result.detail} status={result.status} />;
}

/**
 * Renders one labeled table section (heading + bordered table) of diagnostic rows.
 *
 * @param title - the section heading
 * @param children - the DiagnosticRow/CheckRow elements for this section
 */
function DiagnosticsSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <Stack gap="xs">
      <Title order={3}>{title}</Title>
      <Paper withBorder>
        <Table withTableBorder={false}>
          <Table.Tbody>{children}</Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}

/**
 * Renders the admin diagnostics page: system health, versions, and environment checks.
 */
export function DiagnosticsAdmin() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDiagnostics();

  return (
    <Stack gap="lg" maw={900} mx="auto">
      <div>
        <Title order={2}>{t('diagnosticsAdmin.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('diagnosticsAdmin.subtitle')}
        </Text>
      </div>

      {isLoading && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}

      {isError && (
        <Text c="red" size="sm">
          {t('diagnosticsAdmin.loadError')}
        </Text>
      )}

      {data && (
        <>
          <DiagnosticsSection title={t('diagnosticsAdmin.versionsTitle')}>
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldAppVersion')}
              detail={data.versions.appVersion}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldDbVersion')}
              result={data.versions.dbVersion}
            />
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldRuntimeVersion')}
              detail={data.versions.runtimeVersion}
            />
          </DiagnosticsSection>

          <DiagnosticsSection title={t('diagnosticsAdmin.systemChecksTitle')}>
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldPlatform')}
              detail={data.systemChecks.platform}
            />
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldArchitecture')}
              detail={data.systemChecks.architecture}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldContainerized')}
              result={data.systemChecks.containerized}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldReverseProxyDetected')}
              result={data.systemChecks.reverseProxyDetected}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldInternetAccess')}
              result={data.systemChecks.internetAccess}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldDnsResolution')}
              result={data.systemChecks.dnsResolution}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldWebsocketSupport')}
              result={data.systemChecks.websocketSupport}
            />
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldServerTimeUtc')}
              detail={data.systemChecks.serverTime.utc}
            />
            <DiagnosticRow
              label={t('diagnosticsAdmin.fieldServerTimeLocal')}
              detail={data.systemChecks.serverTime.local}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldClockDrift')}
              result={data.systemChecks.clockDrift}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldDomainMatch')}
              result={data.systemChecks.domainMatch}
            />
            <CheckRow label={t('diagnosticsAdmin.fieldHttps')} result={data.systemChecks.https} />
          </DiagnosticsSection>

          <DiagnosticsSection title={t('diagnosticsAdmin.environmentVariablesTitle')}>
            <CheckRow
              label={t('diagnosticsAdmin.fieldSmtpHost')}
              result={data.environmentVariables.smtpHost}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldSmtpPort')}
              result={data.environmentVariables.smtpPort}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldSmtpFrom')}
              result={data.environmentVariables.smtpFrom}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldSmtpFromName')}
              result={data.environmentVariables.smtpFromName}
            />
            <CheckRow
              label={t('diagnosticsAdmin.fieldLogoDevConfigured')}
              result={data.environmentVariables.logoDevConfigured}
            />
          </DiagnosticsSection>
        </>
      )}
    </Stack>
  );
}
