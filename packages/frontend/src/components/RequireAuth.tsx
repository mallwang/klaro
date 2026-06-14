import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Text } from '@mantine/core';
import { useCurrentUser } from '../hooks/useAuth';

/**
 * Route guard that redirects unauthenticated users to the sign-in page, preserving the
 * intended destination for post-sign-in redirect.
 */

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Renders children only when a session is active; otherwise redirects to /sign-in with the
 * current location stored in router state for post-authentication redirect.
 *
 * @param props - children: the authenticated-only content to protect
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Text size="sm" c="dimmed">
          {t('common.loading')}
        </Text>
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
