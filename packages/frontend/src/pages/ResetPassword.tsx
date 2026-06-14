import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Paper, Title, Stack, PasswordInput, Button, Alert, Text } from '@mantine/core';
import { PublicLayout } from '../components/PublicLayout.js';
import { AuthError } from '../services/auth.js';
import { useResetPassword, CURRENT_USER_QUERY_KEY } from '../hooks/useAuth.js';

/**
 * Reset password page. Collects a new password and confirmation, validates token, and
 * redirects to the dashboard on success.
 */

type TerminalState = 'invalid' | 'expired' | null;

export function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [terminalState, setTerminalState] = useState<TerminalState>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = useResetPassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setGenericError(null);

    if (password !== confirm) {
      setValidationError(t('resetPassword.passwordMismatch'));
      return;
    }

    if (!token) {
      setTerminalState('invalid');
      return;
    }

    setIsPending(true);
    try {
      const user = await resetPasswordMutation.mutateAsync({ token, body: { password } });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 404) {
          const msg = err.message.toLowerCase();
          if (msg.includes('expired')) setTerminalState('expired');
          else setTerminalState('invalid');
        } else if (err.status === 410) {
          setTerminalState('expired');
        } else if (err.status === 400) {
          setValidationError(t('resetPassword.weakPassword'));
        } else {
          setGenericError(t('resetPassword.errorGeneric'));
        }
      } else {
        setGenericError(t('resetPassword.errorGeneric'));
      }
    } finally {
      setIsPending(false);
    }
  }

  const terminalMessages: Record<NonNullable<TerminalState>, string> = {
    invalid: t('resetPassword.invalidToken'),
    expired: t('resetPassword.expiredToken'),
  };

  return (
    <PublicLayout>
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        <Title order={2} mb="lg" ta="center">
          {t('resetPassword.title')}
        </Title>

        {success && (
          <Alert color="green" mb="md">
            <Text fw={600}>{t('resetPassword.successTitle')}</Text>
            <Text size="sm">{t('resetPassword.successMessage')}</Text>
          </Alert>
        )}

        {terminalState && (
          <Alert color="yellow" mb="md">
            {terminalMessages[terminalState]}
          </Alert>
        )}

        {!success && !terminalState && (
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {genericError && (
                <Alert role="alert" color="red">
                  {genericError}
                </Alert>
              )}

              <PasswordInput
                id="reset-password"
                label={t('resetPassword.passwordLabel')}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <PasswordInput
                id="reset-confirm"
                label={t('resetPassword.confirmPasswordLabel')}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={validationError}
              />

              <Button type="submit" fullWidth loading={isPending}>
                {isPending ? t('resetPassword.submitting') : t('resetPassword.submitLabel')}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </PublicLayout>
  );
}
