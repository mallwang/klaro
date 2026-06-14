import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Paper, Loader, Alert, Text } from '@mantine/core';
import { AuthError } from '../services/auth.js';
import { confirmEmailChange } from '../services/profile.js';

type State = 'loading' | 'success' | 'expired' | 'not-found';

export function EmailVerifyConfirm() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    if (!token) {
      setState('not-found');
      return;
    }
    confirmEmailChange(token)
      .then(() => setState('success'))
      .catch((err: unknown) => {
        if (err instanceof AuthError && err.status === 410) {
          setState('expired');
        } else {
          setState('not-found');
        }
      });
  }, [token]);

  return (
    <Center mih="100vh" bg="var(--mantine-color-gray-0)">
      <Paper withBorder shadow="md" p="xl" w={400} radius="md">
        {state === 'loading' && (
          <Center>
            <Loader size="sm" mr="xs" />
            <Text>{t('emailVerify.loading')}</Text>
          </Center>
        )}
        {state === 'success' && <Alert color="green">{t('emailVerify.success')}</Alert>}
        {state === 'expired' && <Alert color="yellow">{t('emailVerify.expired')}</Alert>}
        {state === 'not-found' && <Alert color="red">{t('emailVerify.notFound')}</Alert>}
      </Paper>
    </Center>
  );
}
