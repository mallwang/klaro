import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Title,
  Text,
  Paper,
  Table,
  Avatar,
  Badge,
  Group,
  Button,
  TextInput,
  Center,
  Modal,
} from '@mantine/core';
import type { Account, Invitation } from '@pcm/shared';
import { AuthError } from '../../services/auth.js';
import { sendTestEmail } from '../../services/users.js';
import { useCurrentUser } from '../../hooks/useAuth.js';
import {
  useAccounts,
  useArchiveAccount,
  useReactivateAccount,
  useDeleteAccount,
  useChangeAccountRole,
} from '../../hooks/useAccounts.js';
import {
  useInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
} from '../../hooks/useInvitations.js';
import { showSuccess, showError } from '../../lib/notifications.js';

/**
 * Admin page for managing user accounts and invitations. Provides account listing with
 * role/status controls, invitation sending, test email functionality, and invitation
 * lifecycle management (resend, cancel).
 */

function localeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function InvitationStatusBadge({ invitation }: { invitation: Invitation }) {
  const { t } = useTranslation();
  const isExpired = invitation.status === 'PENDING' && new Date(invitation.expiresAt) < new Date();
  if (isExpired) return <Badge color="gray">{t('accountsAdmin.statusExpired')}</Badge>;
  const config: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'yellow', label: t('accountsAdmin.statusPending') },
    ACCEPTED: { color: 'green', label: t('accountsAdmin.statusAccepted') },
    CANCELLED: { color: 'gray', label: t('accountsAdmin.statusCancelled') },
    SUPERSEDED: { color: 'gray', label: t('accountsAdmin.statusSuperseded') },
  };
  const c = config[invitation.status];
  if (!c) return <span>{invitation.status}</span>;
  return <Badge color={c.color}>{c.label}</Badge>;
}

/**
 * Renders the invite-by-email form. Shows a success toast on send and an error toast on failure.
 */
function InviteForm() {
  const { t } = useTranslation();
  const { mutate: sendInvitation, isPending } = useSendInvitation();
  const [email, setEmail] = useState('');

  /**
   * Returns the localised error message for an invitation failure.
   *
   * @param error - the error thrown by the mutation
   * @returns localised error string
   */
  function resolveInviteError(error: unknown): string {
    if (error instanceof AuthError) {
      if (error.status === 409) return t('accountsAdmin.duplicateEmailError');
      if (error.status === 502) return t('accountsAdmin.mailerError');
    }
    return t('accountsAdmin.inviteError');
  }

  /**
   * Submits the invite form and shows toast feedback on completion.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendInvitation(
      { email: email.trim() },
      {
        onSuccess: () => {
          setEmail('');
          showSuccess(t('accountsAdmin.inviteSuccess'));
        },
        onError: (error) => {
          showError(resolveInviteError(error));
        },
      },
    );
  }

  return (
    <Paper withBorder p="md">
      <Text fw={600} mb="sm">
        {t('accountsAdmin.inviteTitle')}
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group align="flex-end" gap="sm">
            <TextInput
              id="invite-email"
              label={t('accountsAdmin.emailLabel')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" loading={isPending}>
              {isPending ? t('accountsAdmin.inviting') : t('accountsAdmin.inviteButton')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

/**
 * Renders the test-email delivery form. Shows a success toast on send and an error toast on failure.
 */
function TestEmailForm() {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [isPending, setIsPending] = useState(false);

  /**
   * Returns the localised error message for a test email failure.
   *
   * @param error - the error thrown by the send call
   * @returns localised error string
   */
  function resolveTestEmailError(error: unknown): string {
    if (error instanceof AuthError && error.status === 502) {
      return t('accountsAdmin.testEmailMailerError');
    }
    return t('accountsAdmin.testEmailError');
  }

  /**
   * Submits the test email form and shows toast feedback on completion.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      await sendTestEmail({ email: email.trim() });
      showSuccess(t('accountsAdmin.testEmailSuccess'));
    } catch (err) {
      showError(resolveTestEmailError(err));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Paper withBorder p="md">
      <Text fw={600} mb={4}>
        {t('accountsAdmin.testEmailTitle')}
      </Text>
      <Text size="sm" c="dimmed" mb="sm">
        {t('accountsAdmin.testEmailDescription')}
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group align="flex-end" gap="sm">
            <TextInput
              id="test-email-recipient"
              label={t('accountsAdmin.testEmailRecipientLabel')}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" loading={isPending}>
              {isPending ? t('accountsAdmin.testEmailSending') : t('accountsAdmin.testEmailButton')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

function InvitationsTable() {
  const { t } = useTranslation();
  const { data: invitations, isLoading } = useInvitations();
  const { mutate: cancelInvitation } = useCancelInvitation();
  const { mutate: resendInvitation } = useResendInvitation();

  if (isLoading)
    return (
      <Center py="md">
        <Text c="dimmed">{t('common.loading')}</Text>
      </Center>
    );
  if (!invitations || invitations.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        {t('accountsAdmin.noInvitations')}
      </Text>
    );
  }

  return (
    <Paper withBorder>
      <Text fw={600} p="md" pb={0}>
        {t('accountsAdmin.pendingInvitationsTitle')}
      </Text>
      <Table.ScrollContainer minWidth={600}>
        <Table withTableBorder={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('accountsAdmin.columnEmail')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnInvitationStatus')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnSentAt')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnDate')}</Table.Th>
              <Table.Th>{t('accountsAdmin.columnActions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {invitations.map((inv) => {
              const isPending = inv.status === 'PENDING';
              const isExpired = isPending && new Date(inv.expiresAt) < new Date();
              const canAct = isPending && !isExpired;
              return (
                <Table.Tr key={inv.token}>
                  <Table.Td>{inv.email}</Table.Td>
                  <Table.Td>
                    <InvitationStatusBadge invitation={inv} />
                  </Table.Td>
                  <Table.Td>{localeDate(inv.createdAt)}</Table.Td>
                  <Table.Td>
                    {inv.status === 'ACCEPTED' && inv.acceptedAt
                      ? `${t('accountsAdmin.acceptedOn')} ${localeDate(inv.acceptedAt)}`
                      : inv.status === 'CANCELLED' && inv.cancelledAt
                        ? `${t('accountsAdmin.withdrawnOn')} ${localeDate(inv.cancelledAt)}`
                        : `${t('accountsAdmin.expiresOn')} ${localeDate(inv.expiresAt)}`}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {(canAct || isExpired) && (
                        <Button
                          size="compact-sm"
                          variant="default"
                          onClick={() => resendInvitation(inv.token)}
                        >
                          {t('accountsAdmin.resendInviteButton')}
                        </Button>
                      )}
                      {canAct && (
                        <Button
                          size="compact-sm"
                          variant="default"
                          color="red"
                          onClick={() => cancelInvitation(inv.token)}
                        >
                          {t('accountsAdmin.cancelInviteButton')}
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

/**
 * Renders the admin panel for managing user accounts and invitations.
 */
export function AccountsAdmin() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, isError } = useAccounts();
  const { mutate: archiveAccount } = useArchiveAccount();
  const { mutate: reactivateAccount } = useReactivateAccount();
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: changeRole } = useChangeAccountRole();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /**
   * Returns the localised error message for an account action failure.
   *
   * @param error - the error thrown by the mutation
   * @returns localised error string
   */
  function actionErrorMessage(error: unknown): string {
    if (error instanceof AuthError) {
      if (error.status === 409 && (error.message ?? '').toLowerCase().includes('administrator')) {
        return t('accountsAdmin.lastAdminError');
      }
    }
    return t('accountsAdmin.actionError');
  }

  useEffect(() => {
    if (isError) showError(t('accountsAdmin.loadError'));
  }, [isError, t]);

  function isEmailReassigned(email: string): boolean {
    return email.endsWith('@archived.invalid');
  }

  function otherActiveAdminExists(account: Account): boolean {
    if (!accounts) return false;
    return accounts.some((a) => a.id !== account.id && a.role === 'ADMIN' && a.status === 'ACTIVE');
  }

  function userInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('accountsAdmin.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountsAdmin.subtitle')}
        </Text>
      </div>

      <InviteForm />
      <TestEmailForm />
      <InvitationsTable />

      {isLoading && (
        <Center py="xl">
          <Text c="dimmed">{t('common.loading')}</Text>
        </Center>
      )}

      {accounts && (
        <Paper withBorder>
          <Table.ScrollContainer minWidth={500}>
            <Table withTableBorder={false} highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('accountsAdmin.columnName')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnEmail')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnRole')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnStatus')}</Table.Th>
                  <Table.Th>{t('accountsAdmin.columnActions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {accounts.map((account) => {
                  const canChangeRoleOrArchive =
                    account.role !== 'ADMIN' || otherActiveAdminExists(account);
                  return (
                    <Table.Tr key={account.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size={32} radius="xl" color="blue">
                            {userInitials(account.displayName)}
                          </Avatar>
                          <Text size="sm" fw={500}>
                            {account.displayName}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {isEmailReassigned(account.email)
                            ? t('accountsAdmin.emailReassigned')
                            : account.email}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={account.role === 'ADMIN' ? 'blue' : 'gray'} variant="light">
                          {account.role === 'ADMIN'
                            ? t('accountsAdmin.roleAdmin')
                            : t('accountsAdmin.roleMember')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={account.status === 'ACTIVE' ? 'green' : 'gray'}
                          variant="light"
                        >
                          {account.status === 'ACTIVE'
                            ? t('accountsAdmin.statusActive')
                            : t('accountsAdmin.statusArchived')}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {account.status === 'ACTIVE' ? (
                            <>
                              <Button
                                size="compact-sm"
                                variant="default"
                                onClick={() =>
                                  archiveAccount(account.id, {
                                    onError: (err) => showError(actionErrorMessage(err)),
                                  })
                                }
                                disabled={account.role === 'ADMIN' && !canChangeRoleOrArchive}
                              >
                                {t('accountsAdmin.archiveButton')}
                              </Button>
                              {account.role === 'ADMIN' ? (
                                <Button
                                  size="compact-sm"
                                  variant="default"
                                  onClick={() =>
                                    changeRole(
                                      { id: account.id, role: 'MEMBER' },
                                      { onError: (err) => showError(actionErrorMessage(err)) },
                                    )
                                  }
                                  disabled={!canChangeRoleOrArchive}
                                >
                                  {t('accountsAdmin.makeMemberButton')}
                                </Button>
                              ) : (
                                <Button
                                  size="compact-sm"
                                  variant="default"
                                  onClick={() =>
                                    changeRole(
                                      { id: account.id, role: 'ADMIN' },
                                      { onError: (err) => showError(actionErrorMessage(err)) },
                                    )
                                  }
                                >
                                  {t('accountsAdmin.makeAdminButton')}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Group gap="xs">
                              {!isEmailReassigned(account.email) && (
                                <Button
                                  size="compact-sm"
                                  variant="default"
                                  onClick={() =>
                                    reactivateAccount(account.id, {
                                      onError: (err) => showError(actionErrorMessage(err)),
                                    })
                                  }
                                >
                                  {t('accountsAdmin.reactivateButton')}
                                </Button>
                              )}
                              <Button
                                size="compact-sm"
                                variant="filled"
                                color="red"
                                onClick={() => setConfirmDeleteId(account.id)}
                              >
                                {t('accountsAdmin.deleteButton')}
                              </Button>
                            </Group>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Modal
        opened={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title={t('accountsAdmin.deleteConfirmTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{t('accountsAdmin.deleteConfirmMessage')}</Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setConfirmDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (confirmDeleteId)
                  deleteAccount(confirmDeleteId, {
                    onError: (err) => showError(actionErrorMessage(err)),
                  });
                setConfirmDeleteId(null);
              }}
            >
              {t('accountsAdmin.deleteButton')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
