import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  SimpleGrid,
  Title,
  Text,
  Paper,
  Divider,
  PasswordInput,
  TextInput,
  Button,
  Alert,
  Switch,
  SegmentedControl,
} from '@mantine/core';
import { SUPPORTED_EMAIL_LANGUAGES, type Account, type SupportedEmailLanguage } from '@pcm/shared';
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
    navigate('/sign-in');
  }

  // ── Summary Email Preferences ───────────────────────────────────────────────
  const { data: notifPrefs, updatePreferences } = useNotificationPreferences();

  const [summaryEnabled, setSummaryEnabled] = useState(notifPrefs?.summaryEmailEnabled ?? false);
  const [summaryFrequency, setSummaryFrequency] = useState<'WEEKLY' | 'MONTHLY'>(
    notifPrefs?.summaryEmailFrequency ?? 'WEEKLY',
  );
  const [emailLanguage, setEmailLanguage] = useState<SupportedEmailLanguage>(
    notifPrefs?.emailLanguage ?? 'en',
  );
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

  useEffect(() => {
    if (notifPrefs) {
      setSummaryEnabled(notifPrefs.summaryEmailEnabled);
      setSummaryFrequency(notifPrefs.summaryEmailFrequency ?? 'WEEKLY');
      setEmailLanguage(notifPrefs.emailLanguage ?? 'en');
    }
  }, [notifPrefs]);

  /**
   * Submits the summary email preference form and shows toast feedback on success.
   */
  function handleSummaryEmailSave() {
    setIsSavingSummary(true);
    updatePreferences(
      summaryEnabled
        ? { summaryEmailEnabled: true, summaryEmailFrequency: summaryFrequency }
        : { summaryEmailEnabled: false },
      {
        onSuccess: () => {
          setIsSavingSummary(false);
          showSuccess(t('summaryEmail.saved'));
        },
        onError: () => {
          setIsSavingSummary(false);
          showError(t('accountSettings.errorGeneric'));
        },
      },
    );
  }

  /**
   * Persists the user's selected email language preference and shows toast feedback.
   * Always includes the full notification preferences payload to satisfy schema validation.
   */
  function handleEmailLanguageSave() {
    setIsSavingLanguage(true);
    updatePreferences(
      summaryEnabled
        ? { summaryEmailEnabled: true, summaryEmailFrequency: summaryFrequency, emailLanguage }
        : { summaryEmailEnabled: false, emailLanguage },
      {
        onSuccess: () => {
          setIsSavingLanguage(false);
          showSuccess(t('emailLanguage.saved'));
        },
        onError: () => {
          setIsSavingLanguage(false);
          showError(t('emailLanguage.error'));
        },
      },
    );
  }

  // ── Display Name ────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  const displayNameMutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }).catch(() => {});
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
      <Stack gap="lg" maw={900} mx="auto">
        <Title order={2}>{t('accountSettings.title')}</Title>

        {/* Email Settings section */}
        <Stack gap={4}>
          <Title order={3}>{t('accountSettings.emailSettingsSectionTitle')}</Title>
          <Text size="sm" c="dimmed">
            {t('accountSettings.emailSettingsSectionDescription')}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                        local: new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(notifPrefs.nextSendAt)),
                        utc: new Intl.DateTimeFormat(undefined, {
                          timeStyle: 'short',
                          timeZone: 'UTC',
                        }).format(new Date(notifPrefs.nextSendAt)),
                      })}
                    </Text>
                  )}
                </>
              )}
              <Button onClick={handleSummaryEmailSave} loading={isSavingSummary} fullWidth>
                {t('summaryEmail.save')}
              </Button>
            </Stack>
          </Paper>

          {/* Email Language */}
          <Paper withBorder p="lg">
            <Stack gap="md">
              <Title order={4}>{t('emailLanguage.title')}</Title>
              <div>
                <Text size="sm" fw={500} mb={4}>
                  {t('emailLanguage.label')}
                </Text>
                <SegmentedControl
                  value={emailLanguage}
                  onChange={(v) => setEmailLanguage(v as SupportedEmailLanguage)}
                  data={SUPPORTED_EMAIL_LANGUAGES.map((lang) => ({
                    label: t(`emailLanguage.${lang}`),
                    value: lang,
                  }))}
                />
              </div>
              <Button onClick={handleEmailLanguageSave} loading={isSavingLanguage} fullWidth>
                {t('emailLanguage.save')}
              </Button>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Divider my="md" />

        {/* Account section */}
        <Stack gap={4}>
          <Title order={3}>{t('accountSettings.accountSectionTitle')}</Title>
          <Text size="sm" c="dimmed">
            {t('accountSettings.accountSectionDescription')}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
        </SimpleGrid>
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
