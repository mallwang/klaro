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
  Divider,
  Box,
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
 * Admin page for managing user accounts and invitations. Shows the accounts list first,
 * followed by a compact invitations section with an inline invite form, and a test email
 * utility at the bottom. Page width is constrained to match the My Account page.
 */

/**
 * Formats an ISO date string as a locale-aware date.
 *
 * @param iso - ISO 8601 date string
 * @returns localised date string, or the original string on parse failure
 */
function localeDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * Renders a status badge for an invitation, treating pending-but-expired invitations as expired.
 *
 * @param invitation - the invitation whose status to display
 * @returns a coloured Badge element
 */
function InvitationStatusBadge({ invitation }: Readonly<{ invitation: Invitation }>) {
  const { t } = useTranslation();
  const isExpired = invitation.status === 'PENDING' && new Date(invitation.expiresAt) < new Date();
  if (isExpired)
    return (
      <Badge color="gray" variant="light">
        {t('accountsAdmin.statusExpired')}
      </Badge>
    );
  const config: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'yellow', label: t('accountsAdmin.statusPending') },
    ACCEPTED: { color: 'green', label: t('accountsAdmin.statusAccepted') },
    CANCELLED: { color: 'gray', label: t('accountsAdmin.statusCancelled') },
    SUPERSEDED: { color: 'gray', label: t('accountsAdmin.statusSuperseded') },
  };
  const c = config[invitation.status];
  if (!c) return <span>{invitation.status}</span>;
  return (
    <Badge color={c.color} variant="light">
      {c.label}
    </Badge>
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

/**
 * Renders the invitations table with resend and cancel actions.
 */
function InvitationsTable() {
  const { t } = useTranslation();
  const { data: invitations, isLoading } = useInvitations();

  /**
   * Returns a localised date label describing the invitation's last relevant action or expiry.
   *
   * @param inv - the invitation to describe
   * @returns a formatted date string with a contextual prefix
   */
  function invitationDateLabel(inv: Invitation): string {
    if (inv.status === 'ACCEPTED' && inv.acceptedAt)
      return `${t('accountsAdmin.acceptedOn')} ${localeDate(inv.acceptedAt)}`;
    if (inv.status === 'CANCELLED' && inv.cancelledAt)
      return `${t('accountsAdmin.withdrawnOn')} ${localeDate(inv.cancelledAt)}`;
    return `${t('accountsAdmin.expiresOn')} ${localeDate(inv.expiresAt)}`;
  }
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
                  <Table.Td>{invitationDateLabel(inv)}</Table.Td>
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
 * Returns true when the given email has been reassigned to an archived-account placeholder address.
 *
 * @param email - the account email to check
 * @returns true if the email ends with the archived-account domain
 */
function isEmailReassigned(email: string): boolean {
  return email.endsWith('@archived.invalid');
}

/**
 * Derives up-to-two uppercase initials from a display name.
 *
 * @param name - the user's display name
 * @returns initials string (1–2 characters, uppercase)
 */
function userInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Renders the admin panel for managing user accounts and invitations.
 *
 * Sections from top to bottom: accounts list, invitations (with inline invite form), test email.
 * Page width matches the My Account page via maw/mx constraints on the outer Stack.
 */
export function AccountsAdmin() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, isError } = useAccounts();
  const { mutate: archiveAccount } = useArchiveAccount();
  const { mutate: reactivateAccount } = useReactivateAccount();
  const { mutate: deleteAccount } = useDeleteAccount();
  const { mutate: changeRole } = useChangeAccountRole();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Invite form state (lifted from the dissolved InviteForm sub-component)
  const { mutate: sendInvitation, isPending: isInviting } = useSendInvitation();
  const [inviteEmail, setInviteEmail] = useState('');

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
   *
   * @param e - the form submit event
   */
  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendInvitation(
      { email: inviteEmail.trim() },
      {
        onSuccess: () => {
          setInviteEmail('');
          showSuccess(t('accountsAdmin.inviteSuccess'));
        },
        onError: (error) => {
          showError(resolveInviteError(error));
        },
      },
    );
  }

  useEffect(() => {
    if (isError) showError(t('accountsAdmin.loadError'));
  }, [isError, t]);

  /**
   * Returns true when at least one other active admin account exists besides the given account.
   *
   * @param account - the account to check against
   * @returns true if another active admin exists
   */
  function otherActiveAdminExists(account: Account): boolean {
    if (!accounts) return false;
    return accounts.some((a) => a.id !== account.id && a.role === 'ADMIN' && a.status === 'ACTIVE');
  }

  return (
    <Stack gap="lg" maw={900} mx="auto">
      <div>
        <Title order={2}>{t('accountsAdmin.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountsAdmin.subtitle')}
        </Text>
      </div>

      {/* Accounts list — primary content, shown first */}
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
                        <Badge color={account.role === 'ADMIN' ? 'red' : 'blue'} variant="light">
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

      <Divider my="md" />

      {/* Invitations section — inline invite form above the invitations table */}
      <Stack gap={4}>
        <Title order={3}>{t('accountsAdmin.pendingInvitationsTitle')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountsAdmin.pendingInvitationsDescription')}
        </Text>
      </Stack>

      <form onSubmit={handleInviteSubmit}>
        <Group align="flex-end" gap="sm">
          <TextInput
            id="invite-email"
            label={t('accountsAdmin.emailLabel')}
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" loading={isInviting}>
            {isInviting ? t('accountsAdmin.inviting') : t('accountsAdmin.inviteButton')}
          </Button>
        </Group>
      </form>

      <InvitationsTable />

      <Divider my="md" />

      {/* Test email — diagnostic utility, shown last */}
      <Stack gap={4}>
        <Title order={3}>{t('accountsAdmin.testEmailTitle')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountsAdmin.testEmailDescription')}
        </Text>
      </Stack>
      <Box maw="50%">
        <TestEmailForm />
      </Box>

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
