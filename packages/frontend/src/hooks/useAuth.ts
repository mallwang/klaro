import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser, SignInBody } from '@pcm/shared';
import { fetchCurrentUser, signIn, signOut } from '../services/auth';

/**
 * TanStack Query hooks for session authentication: current user, sign-in, and sign-out.
 */

export const CURRENT_USER_QUERY_KEY = ['auth', 'me'];

/**
 * Returns a TanStack Query result for the currently authenticated user, refreshed every
 * 60 s.
 */
export function useCurrentUser() {
  return useQuery<SessionUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Returns a mutation for signing in with email and password, populating the current-user
 * cache on success.
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SignInBody) => signIn(body),
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
    },
  });
}

/**
 * Returns a mutation for signing out, clearing all query cache data on success.
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.clear();
    },
  });
}
