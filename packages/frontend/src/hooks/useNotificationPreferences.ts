import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferences, UpdateNotificationPreferencesBody } from '@pcm/shared';

/**
 * React Query hook for reading and updating the authenticated user's summary email
 * notification preferences.
 */

const QUERY_KEY = ['notification-preferences'] as const;

async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await fetch('/api/profile/notification-preferences', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch notification preferences');
  return res.json() as Promise<NotificationPreferences>;
}

async function patchNotificationPreferences(
  body: UpdateNotificationPreferencesBody,
): Promise<void> {
  const res = await fetch('/api/profile/notification-preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to update notification preferences');
}

/**
 * Provides notification preference data and a mutation to update them.
 *
 * @returns Query data, loading state, and an `updatePreferences` mutate function
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery<NotificationPreferences>({
    queryKey: QUERY_KEY,
    queryFn: fetchNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: patchNotificationPreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updatePreferences: mutation.mutate,
    isPending: mutation.isPending,
  };
}
