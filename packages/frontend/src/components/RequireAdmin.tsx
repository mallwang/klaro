import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Center, Text } from '@mantine/core';
import { useCurrentUser } from '../hooks/useAuth.js';

/**
 * Route guard that restricts access to users with the ADMIN role, redirecting non-admins to
 * the home page.
 */

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Renders children only when the current user is an authenticated administrator; otherwise
 * redirects to /sign-in (unauthenticated) or / (insufficient role).
 *
 * @param props - children: the admin-only content to protect
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { t } = useTranslation();
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
    return <Navigate to="/sign-in" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
