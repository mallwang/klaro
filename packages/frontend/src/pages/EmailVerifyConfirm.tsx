import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Paper, Loader, Alert, Text, Button, Stack } from '@mantine/core';
import { AuthError } from '../services/auth.js';
import { confirmEmailChange } from '../services/profile.js';
import { PublicLayout } from '../components/PublicLayout.js';

/**
 * Email verification confirmation page. Automatically confirms the email change using the
 * token from the URL and displays success, expiration, or error states.
 */

type State = 'loading' | 'success' | 'expired' | 'not-found';

export function EmailVerifyConfirm() {
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
    confirmEmailChange(token)
      .then(() => {
        setState('success');
        setTimeout(() => navigate('/', { replace: true }), 3000);
      })
      .catch((err: unknown) => {
        if (err instanceof AuthError && err.status === 410) {
          setState('expired');
        } else {
          setState('not-found');
        }
      });
  }, [token, navigate]);

  return (
    <PublicLayout>
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        {state === 'loading' && (
          <Center>
            <Loader size="sm" mr="xs" />
            <Text>{t('emailVerify.loading')}</Text>
          </Center>
        )}
        {state === 'success' && (
          <Stack gap="md">
            <Alert color="green">{t('emailVerify.success')}</Alert>
            <Button onClick={() => navigate('/', { replace: true })} fullWidth>
              {t('emailVerify.toDashboard')}
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              {t('emailVerify.redirecting')}
            </Text>
          </Stack>
        )}
        {state === 'expired' && <Alert color="yellow">{t('emailVerify.expired')}</Alert>}
        {state === 'not-found' && <Alert color="red">{t('emailVerify.notFound')}</Alert>}
      </Paper>
    </PublicLayout>
  );
}
