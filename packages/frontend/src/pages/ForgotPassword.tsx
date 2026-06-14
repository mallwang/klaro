import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Stack, TextInput, Button, Alert, Text, Anchor } from '@mantine/core';
import { AuthCard } from '../components/AuthCard.js';
import { AuthError } from '../services/auth.js';
import { useRequestPasswordReset } from '../hooks/useAuth.js';

/**
 * Forgot password page. Collects the user's email address and sends a password reset
 * link. Always shows a generic success message to prevent email enumeration.
 */

export function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestPasswordReset = useRequestPasswordReset();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setGenericError(null);

    setIsPending(true);
    try {
      await requestPasswordReset.mutateAsync({ email });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 400) {
          setValidationError(t('forgotPassword.invalidEmail'));
        } else {
          setGenericError(t('forgotPassword.errorGeneric'));
        }
      } else {
        setGenericError(t('forgotPassword.errorGeneric'));
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthCard title={t('forgotPassword.title')}>
      {success && (
        <Alert color="green" mb="md">
          <Text fw={600}>{t('forgotPassword.successTitle')}</Text>
          <Text size="sm">{t('forgotPassword.successMessage')}</Text>
        </Alert>
      )}

      {!success && (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            {genericError && (
              <Alert role="alert" color="red">
                {genericError}
              </Alert>
            )}

            <TextInput
              id="forgot-email"
              label={t('forgotPassword.emailLabel')}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationError}
            />

            <Button type="submit" fullWidth loading={isPending}>
              {isPending ? t('forgotPassword.submitting') : t('forgotPassword.submitLabel')}
            </Button>
          </Stack>
        </form>
      )}

      <Anchor component={Link} to="/sign-in" size="sm" ta="center" mt="md" display="block">
        {t('forgotPassword.backToSignIn')}
      </Anchor>
    </AuthCard>
  );
}
