import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Navigate, type Location } from 'react-router-dom';
import {
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Anchor,
  Paper,
  Title,
  Text,
} from '@mantine/core';
import { AuthError } from '../services/auth.js';
import { useCurrentUser, useSignIn, useRequestPasswordReset } from '../hooks/useAuth.js';
import { useSubmitSignup } from '../hooks/useSignupRequests.js';
import { AuthImageLayout } from '../components/AuthImageLayout.js';

/**
 * Combined sign-in, forgot-password, and sign-up page rendered within the two-column
 * AuthImageLayout. A view state variable toggles between the three forms without
 * a page reload. The /sign-in, /forgot-password, and /sign-up routes all render this
 * component with the appropriate initialView prop.
 */

type AuthView = 'sign-in' | 'forgot-password' | 'sign-up';

interface AuthPageProps {
  /** Which form to display on first render. */
  initialView: AuthView;
}

interface LocationState {
  from?: Location;
}

/**
 * Renders the authentication page with a sign-in or forgot-password form inside
 * the two-column AuthImageLayout. Redirects already-authenticated users to /.
 *
 * @param props - initialView: which form to show on initial render
 */
export function AuthPage({ initialView }: AuthPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: currentUser, isLoading: isCheckingSession } = useCurrentUser();

  // View toggle state
  const [view, setView] = useState<AuthView>(initialView);

  // Sign-in form state
  const { mutate: signIn, isPending: isSignInPending, error: signInError } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot-password form state
  const requestPasswordReset = useRequestPasswordReset();
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIsPending, setForgotIsPending] = useState(false);
  const [forgotValidationError, setForgotValidationError] = useState<string | null>(null);
  const [forgotGenericError, setForgotGenericError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Sign-up form state
  const { mutate: submitSignup, isPending: isSigningUp } = useSubmitSignup();
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (isCheckingSession) return null;
  if (currentUser) return <Navigate to="/" replace />;

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? '/';
    signIn(
      { email: email.trim(), password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  }

  function signInErrorMessage(): string | null {
    if (!signInError) return null;
    if (signInError instanceof AuthError) {
      if (signInError.status === 423) return t('auth.errorLocked');
      if (signInError.status === 401) return t('auth.errorInvalidCredentials');
    }
    return t('auth.errorGeneric');
  }

  function resolveSignupError(error: unknown): string {
    if (error instanceof AuthError) {
      if (error.status === 409) return t('signUp.duplicateEmailError');
      if (error.status === 400) return t('signUp.weakPasswordError');
      if (error.status === 502) return t('signUp.mailerError');
    }
    return t('signUp.errorGeneric');
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);
    submitSignup(
      { email: signupEmail.trim(), password: signupPassword },
      {
        onSuccess: () => setSignupSuccess(true),
        onError: (err) => setSignupError(resolveSignupError(err)),
      },
    );
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotValidationError(null);
    setForgotGenericError(null);
    setForgotIsPending(true);
    try {
      await requestPasswordReset.mutateAsync({ email: forgotEmail });
      setForgotSuccess(true);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 400) {
          setForgotValidationError(t('forgotPassword.invalidEmail'));
        } else {
          setForgotGenericError(t('forgotPassword.errorGeneric'));
        }
      } else {
        setForgotGenericError(t('forgotPassword.errorGeneric'));
      }
    } finally {
      setForgotIsPending(false);
    }
  }

  const headings: Record<AuthView, string> = {
    'sign-in': t('authPage.signInHeading'),
    'forgot-password': t('authPage.forgotHeading'),
    'sign-up': t('authPage.signUpHeading'),
  };
  const subtitles: Record<AuthView, string> = {
    'sign-in': t('authPage.signInSubtitle'),
    'forgot-password': t('authPage.forgotSubtitle'),
    'sign-up': t('authPage.signUpSubtitle'),
  };

  return (
    <AuthImageLayout>
      <Stack gap={0} w={400}>
        <Title order={2} ta="center">
          {headings[view]}
        </Title>
        <Text c="dimmed" size="sm" ta="center" mt={5} mb="lg">
          {subtitles[view]}
        </Text>
        <Paper withBorder shadow="md" p="xl" radius="md">
          {view === 'sign-in' && (
            <form onSubmit={handleSignIn}>
              <Stack gap="md">
                {signInErrorMessage() && (
                  <Alert role="alert" color="red">
                    {signInErrorMessage()}
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
                <Button type="submit" fullWidth loading={isSignInPending}>
                  {isSignInPending ? t('auth.submitting') : t('auth.submitLabel')}
                </Button>
                <Anchor
                  component="button"
                  type="button"
                  size="sm"
                  ta="center"
                  onClick={() => setView('forgot-password')}
                >
                  {t('auth.forgotPasswordLink')}
                </Anchor>
                <Anchor
                  component="button"
                  type="button"
                  size="sm"
                  ta="center"
                  onClick={() => setView('sign-up')}
                >
                  {t('auth.signUpLink')}
                </Anchor>
              </Stack>
            </form>
          )}

          {view === 'forgot-password' && (
            <>
              {forgotSuccess ? (
                <Alert color="green" mb="md" role="alert">
                  <Text fw={600}>{t('forgotPassword.successTitle')}</Text>
                  <Text size="sm">{t('forgotPassword.successMessage')}</Text>
                </Alert>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <Stack gap="md">
                    {forgotGenericError && (
                      <Alert role="alert" color="red">
                        {forgotGenericError}
                      </Alert>
                    )}
                    <TextInput
                      id="forgot-email"
                      label={t('forgotPassword.emailLabel')}
                      type="email"
                      autoComplete="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      error={forgotValidationError}
                    />
                    <Button type="submit" fullWidth loading={forgotIsPending}>
                      {forgotIsPending
                        ? t('forgotPassword.submitting')
                        : t('forgotPassword.submitLabel')}
                    </Button>
                  </Stack>
                </form>
              )}
              <Anchor
                component="button"
                type="button"
                size="sm"
                ta="center"
                mt="md"
                display="block"
                w="100%"
                onClick={() => setView('sign-in')}
              >
                {t('forgotPassword.backToSignIn')}
              </Anchor>
            </>
          )}

          {view === 'sign-up' && (
            <>
              {signupSuccess ? (
                <Alert color="green" mb="md" role="alert">
                  <Text fw={600}>{t('signUp.successTitle')}</Text>
                  <Text size="sm">{t('signUp.successMessage')}</Text>
                </Alert>
              ) : (
                <form onSubmit={handleSignup}>
                  <Stack gap="md">
                    {signupError && (
                      <Alert role="alert" color="red">
                        {signupError}
                      </Alert>
                    )}
                    <TextInput
                      id="signup-email"
                      label={t('signUp.emailLabel')}
                      type="email"
                      autoComplete="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                    <PasswordInput
                      id="signup-password"
                      label={t('signUp.passwordLabel')}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth loading={isSigningUp}>
                      {isSigningUp ? t('signUp.submitting') : t('signUp.submitLabel')}
                    </Button>
                  </Stack>
                </form>
              )}
              <Anchor
                component="button"
                type="button"
                size="sm"
                ta="center"
                mt="md"
                display="block"
                w="100%"
                onClick={() => setView('sign-in')}
              >
                {t('signUp.backToSignIn')}
              </Anchor>
            </>
          )}
        </Paper>
      </Stack>
    </AuthImageLayout>
  );
}
