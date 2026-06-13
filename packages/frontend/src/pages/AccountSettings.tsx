import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Stack, Title, Text, Paper, PasswordInput, Button, Alert } from '@mantine/core';
import { AuthError, changePassword } from '../services/auth.js';

export function AccountSettings() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: changePassword,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setSuccess(true);
        },
      },
    );
  }

  function errorMessage(): string | null {
    if (!error) return null;
    if (error instanceof AuthError && error.status === 401) {
      return t('accountSettings.errorInvalidCurrent');
    }
    return t('accountSettings.errorGeneric');
  }

  return (
    <Stack gap="lg" maw={480} mx="auto">
      <div>
        <Title order={2}>{t('accountSettings.title')}</Title>
        <Text size="sm" c="dimmed">
          {t('accountSettings.subtitle')}
        </Text>
      </div>

      <Paper withBorder p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {errorMessage() && (
              <Alert role="alert" color="red">
                {errorMessage()}
              </Alert>
            )}
            {success && !error && (
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

            <Button type="submit" loading={isPending} fullWidth>
              {isPending ? t('accountSettings.submitting') : t('accountSettings.submitLabel')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
