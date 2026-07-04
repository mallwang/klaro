import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Paper, Loader, Alert, Text, Button, Stack } from '@mantine/core';
import { AuthError } from '../services/auth.js';
import { verifySignup } from '../services/signup.js';
import { PublicLayout } from '../components/PublicLayout.js';

/**
 * Sign-up verification confirmation page. Automatically verifies the sign-up request using
 * the token from the URL and displays success, expired, already-used, or not-found states.
 */

type State = 'loading' | 'success' | 'expired' | 'already-used' | 'not-found';

export function SignupVerifyConfirm() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('loading');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!token) {
      setState('not-found');
      return;
    }
    verifySignup(token)
      .then(() => setState('success'))
      .catch((err: unknown) => {
        if (err instanceof AuthError && err.status === 410) {
          setState(err.message.toLowerCase().includes('already') ? 'already-used' : 'expired');
        } else {
          setState('not-found');
        }
      });
  }, [token]);

  return (
    <PublicLayout>
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        {state === 'loading' && (
          <Center>
            <Loader size="sm" mr="xs" />
            <Text>{t('signupVerify.loading')}</Text>
          </Center>
        )}
        {state === 'success' && (
          <Stack gap="md">
            <Alert color="green">{t('signupVerify.success')}</Alert>
            <Button onClick={() => navigate('/sign-in', { replace: true })} fullWidth>
              {t('signupVerify.toSignIn')}
            </Button>
          </Stack>
        )}
        {state === 'expired' && <Alert color="yellow">{t('signupVerify.expired')}</Alert>}
        {state === 'already-used' && <Alert color="yellow">{t('signupVerify.alreadyUsed')}</Alert>}
        {state === 'not-found' && <Alert color="red">{t('signupVerify.notFound')}</Alert>}
      </Paper>
    </PublicLayout>
  );
}
