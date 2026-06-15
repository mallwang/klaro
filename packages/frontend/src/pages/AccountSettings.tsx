import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Text,
  Paper,
  PasswordInput,
  TextInput,
  Button,
  Alert,
  Switch,
  SegmentedControl,
} from '@mantine/core';
import type { Account } from '@pcm/shared';
import { AuthError, changePassword } from '../services/auth.js';
import {
  updateDisplayName,
  requestEmailChange,
  getPendingEmailChange,
} from '../services/profile.js';
import { fetchAccounts } from '../services/users.js';
import { ACCOUNTS_QUERY_KEY } from '../hooks/useAccounts.js';
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from '../hooks/useAuth.js';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences.js';
import { DeleteAccountModal } from '../components/DeleteAccountModal.js';
import { useContracts } from '../services/contracts.js';
import { showSuccess, showError } from '../lib/notifications.js';

/**
 * Account settings page for managing display name, email changes, password updates,
 * summary email preferences, and account deletion. Includes a sole-admin guard that
 * prevents the last admin from deleting their account.
 */

export function AccountSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  // ── Contracts (for export advisory) ─────────────────────────────────────────
  const { data: contracts = [] } = useContracts();

  // ── Accounts (for sole-admin guard) ─────────────────────────────────────────
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccounts,
    enabled: user?.role === 'ADMIN',
    staleTime: 30_000,
  });

  const isSoleAdmin =
    user?.role === 'ADMIN' &&
    (accounts ?? []).filter((a) => a.role === 'ADMIN' && a.status === 'ACTIVE').length <= 1;

  // ── Delete Account modal ─────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  /**
   * Clears the query cache and navigates to sign-in after successful account deletion.
   */
  function handleDeleted() {
    queryClient.clear();
    void navigate('/sign-in');
  }

  // ── Summary Email Preferences ───────────────────────────────────────────────
  const {
    data: notifPrefs,
    updatePreferences,
    isPending: isUpdatingPrefs,
  } = useNotificationPreferences();

  const [summaryEnabled, setSummaryEnabled] = useState(notifPrefs?.summaryEmailEnabled ?? false);
  const [summaryFrequency, setSummaryFrequency] = useState<'WEEKLY' | 'MONTHLY'>(
    notifPrefs?.summaryEmailFrequency ?? 'WEEKLY',
  );

  /**
   * Submits the summary email preference form and shows toast feedback on success.
   */
  function handleSummaryEmailSave() {
    updatePreferences(
      summaryEnabled
        ? { summaryEmailEnabled: true, summaryEmailFrequency: summaryFrequency }
        : { summaryEmailEnabled: false },
      {
        onSuccess: () => showSuccess(t('summaryEmail.saved')),
        onError: () => showError(t('accountSettings.errorGeneric')),
      },
    );
  }

  // ── Display Name ────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  const displayNameMutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      showSuccess(t('accountSettings.displayNameSuccess'));
    },
    onError: () => {
      showError(t('accountSettings.displayNameError'));
    },
  });

  /**
   * Submits the display name form, trimming whitespace before mutating.
   */
  function handleDisplayNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    displayNameMutation.mutate(displayName.trim());
  }

  // ── Email Change ────────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('');

  const { data: pendingData } = useQuery({
    queryKey: ['profile', 'pendingEmail'],
    queryFn: getPendingEmailChange,
  });

  const emailChangeMutation = useMutation({
    mutationFn: (email: string) => requestEmailChange(email),
    onSuccess: () => {
      setNewEmail('');
      showSuccess(t('accountSettings.emailChangeSent'));
    },
    onError: (error) => {
      showError(resolveEmailChangeError(error));
    },
  });

  /**
   * Submits the email change form, trimming whitespace before mutating.
   */
  function handleEmailChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    emailChangeMutation.mutate(newEmail.trim());
  }

  /**
   * Returns a localised error message for an email change error, distinguishing
   * the 409 conflict case from generic errors.
   *
   * @param error - the error thrown by the mutation
   * @returns localised error string
   */
  function resolveEmailChangeError(error: unknown): string {
    if (error instanceof AuthError && error.status === 409) {
      return t('accountSettings.emailChangeConflict');
    }
    return t('accountSettings.emailChangeError');
  }

  // ── Change Password ─────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { mutate: doChangePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: changePassword,
  });

  /**
   * Submits the password change form and shows toast feedback on completion.
   */
  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    doChangePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          showSuccess(t('accountSettings.success'));
        },
        onError: (err) => {
          showError(resolvePasswordError(err));
        },
      },
    );
  }

  /**
   * Returns a localised error message for a password change error, distinguishing
   * the 401 wrong-current-password case from generic errors.
   *
   * @param error - the error thrown by the mutation
   * @returns localised error string
   */
  function resolvePasswordError(error: unknown): string {
    if (error instanceof AuthError && error.status === 401) {
      return t('accountSettings.errorInvalidCurrent');
    }
    return t('accountSettings.errorGeneric');
  }

  return (
    <>
      <Stack gap="lg" maw={480} mx="auto">
        <Title order={2}>{t('accountSettings.title')}</Title>

        {/* Summary Email */}
        <Paper withBorder p="lg">
          <Stack gap="md">
            <Title order={4}>{t('summaryEmail.title')}</Title>
            <Switch
              label={t('summaryEmail.toggle')}
              checked={summaryEnabled}
              onChange={(e) => setSummaryEnabled(e.currentTarget.checked)}
            />
            {summaryEnabled && (
              <>
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    {t('summaryEmail.frequency')}
                  </Text>
                  <SegmentedControl
                    value={summaryFrequency}
                    onChange={(v) => setSummaryFrequency(v as 'WEEKLY' | 'MONTHLY')}
                    data={[
                      { label: t('summaryEmail.weekly'), value: 'WEEKLY' },
                      { label: t('summaryEmail.monthly'), value: 'MONTHLY' },
                    ]}
                  />
                </div>
                {notifPrefs?.nextSendAt && (
                  <Text size="sm" c="dimmed">
                    {t('summaryEmail.nextSend', {
                      datetime: new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(notifPrefs.nextSendAt)),
                    })}
                  </Text>
                )}
              </>
            )}
            <Button onClick={handleSummaryEmailSave} loading={isUpdatingPrefs} fullWidth>
              {t('summaryEmail.save')}
            </Button>
          </Stack>
        </Paper>

        {/* Display Name */}
        <Paper withBorder p="lg">
          <form onSubmit={handleDisplayNameSubmit}>
            <Stack gap="md">
              <TextInput
                id="display-name"
                label={t('accountSettings.displayNameLabel')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Button type="submit" loading={displayNameMutation.isPending} fullWidth>
                {t('accountSettings.displayNameSaveLabel')}
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Email Address */}
        <Paper withBorder p="lg">
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500}>
                {t('accountSettings.emailSectionTitle')}
              </Text>
              <Text size="sm" c="dimmed">
                {user?.email}
              </Text>
            </div>

            {pendingData?.pendingEmail && (
              <Alert color="blue">
                {t('accountSettings.pendingEmailNotice', { email: pendingData.pendingEmail })}
              </Alert>
            )}

            <form onSubmit={handleEmailChangeSubmit}>
              <Stack gap="md">
                <TextInput
                  id="new-email"
                  type="email"
                  label={t('accountSettings.newEmailLabel')}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button type="submit" loading={emailChangeMutation.isPending} fullWidth>
                  {t('accountSettings.emailChangeSubmitLabel')}
                </Button>
              </Stack>
            </form>
          </Stack>
        </Paper>

        {/* Change Password */}
        <Paper withBorder p="lg">
          <form onSubmit={handlePasswordSubmit}>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                {t('accountSettings.subtitle')}
              </Text>

              <PasswordInput
                id="current-password"
                label={t('accountSettings.currentPasswordLabel')}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <PasswordInput
                id="new-password"
                label={t('accountSettings.newPasswordLabel')}
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button type="submit" loading={isChangingPassword} fullWidth>
                {isChangingPassword
                  ? t('accountSettings.submitting')
                  : t('accountSettings.submitLabel')}
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Danger Zone */}
        <Paper withBorder p="lg" style={{ borderColor: 'var(--mantine-color-red-6)' }}>
          <Stack gap="md">
            <Text fw={600} c="red">
              {t('dangerZone.title')}
            </Text>
            <Text size="sm" c="dimmed">
              {t('dangerZone.description')}
            </Text>
            <Button color="red" variant="outline" onClick={() => setDeleteModalOpen(true)}>
              {t('dangerZone.deleteButton')}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      <DeleteAccountModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDeleted={handleDeleted}
        contracts={contracts}
        isSoleAdmin={isSoleAdmin}
      />
    </>
  );
}
