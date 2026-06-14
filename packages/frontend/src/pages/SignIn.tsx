import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Navigate, type Location, Link } from 'react-router-dom';
import { Stack, TextInput, PasswordInput, Button, Alert, Anchor } from '@mantine/core';
import { AuthError } from '../services/auth';
import { useCurrentUser, useSignIn } from '../hooks/useAuth';
import { AuthCard } from '../components/AuthCard.js';

/**
 * Sign-in page with email and password form. Redirects authenticated users to the dashboard
 * and stores the return location for post-login navigation.
 */

interface LocationState {
  from?: Location;
}

export function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: currentUser, isLoading: isCheckingSession } = useCurrentUser();
  const { mutate: signIn, isPending, error } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? '/';
    signIn(
      { email: email.trim(), password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  }

  if (isCheckingSession) return null;
  if (currentUser) return <Navigate to="/" replace />;

  function errorMessage(): string | null {
    if (!error) return null;
    if (error instanceof AuthError) {
      if (error.status === 423) return t('auth.errorLocked');
      if (error.status === 401) return t('auth.errorInvalidCredentials');
    }
    return t('auth.errorGeneric');
  }

  return (
    <AuthCard title={t('auth.signInTitle')}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {errorMessage() && (
            <Alert role="alert" color="red">
              {errorMessage()}
            </Alert>
          )}

          <TextInput
            id="email"
            label={t('auth.emailLabel')}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            id="password"
            label={t('auth.passwordLabel')}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" fullWidth loading={isPending}>
            {isPending ? t('auth.submitting') : t('auth.submitLabel')}
          </Button>

          <Anchor component={Link} to="/forgot-password" size="sm" ta="center">
            {t('auth.forgotPasswordLink')}
          </Anchor>
        </Stack>
      </form>
    </AuthCard>
  );
}
