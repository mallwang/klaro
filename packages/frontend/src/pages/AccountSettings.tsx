import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Stack, Title, Text, Paper, PasswordInput, TextInput, Button, Alert } from '@mantine/core';
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
import { DeleteAccountModal } from '../components/DeleteAccountModal.js';
import { useContracts } from '../services/contracts.js';

/**
 * Account settings page for managing display name, email changes, password updates, and
 * account deletion. Includes a sole-admin guard that prevents the last admin from deleting
 * their account.
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

  function handleDeleted() {
    queryClient.clear();
    void navigate('/sign-in');
  }

  // ── Display Name ────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');

  const displayNameMutation = useMutation({
    mutationFn: (name: string) => updateDisplayName(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });

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
    },
  });

  function handleEmailChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    emailChangeMutation.mutate(newEmail.trim());
  }

  function emailChangeErrorMessage(): string | null {
    if (!emailChangeMutation.error) return null;
    if (
      emailChangeMutation.error instanceof AuthError &&
      emailChangeMutation.error.status === 409
    ) {
      return t('accountSettings.emailChangeConflict');
    }
    return t('accountSettings.emailChangeError');
  }

  // ── Change Password ─────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    mutate: doChangePassword,
    isPending: isChangingPassword,
    error: passwordError,
  } = useMutation({
    mutationFn: changePassword,
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSuccess(false);
    doChangePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setPasswordSuccess(true);
        },
      },
    );
  }

  function passwordErrorMessage(): string | null {
    if (!passwordError) return null;
    if (passwordError instanceof AuthError && passwordError.status === 401) {
      return t('accountSettings.errorInvalidCurrent');
    }
    return t('accountSettings.errorGeneric');
  }

  return (
    <>
      <Stack gap="lg" maw={480} mx="auto">
        <Title order={2}>{t('accountSettings.title')}</Title>

        {/* Display Name */}
        <Paper withBorder p="lg">
          <form onSubmit={handleDisplayNameSubmit}>
            <Stack gap="md">
              {displayNameMutation.isError && (
                <Alert role="alert" color="red">
                  {t('accountSettings.displayNameError')}
                </Alert>
              )}
              {displayNameMutation.isSuccess && (
                <Alert role="status" color="green">
                  {t('accountSettings.displayNameSuccess')}
                </Alert>
              )}
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

            {emailChangeMutation.isSuccess && (
              <Alert color="green">{t('accountSettings.emailChangeSent')}</Alert>
            )}

            {emailChangeErrorMessage() && (
              <Alert role="alert" color="red">
                {emailChangeErrorMessage()}
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
              {passwordErrorMessage() && (
                <Alert role="alert" color="red">
                  {passwordErrorMessage()}
                </Alert>
              )}
              {passwordSuccess && !passwordError && (
                <Alert role="status" color="green">
                  {t('accountSettings.success')}
                </Alert>
              )}

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
