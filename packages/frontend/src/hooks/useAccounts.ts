import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Account, CreateAccountBody, Role } from '@pcm/shared';
import {
  fetchAccounts,
  createAccount,
  archiveAccount,
  reactivateAccount,
  deleteAccount,
  changeAccountRole,
} from '../services/users.js';

/**
 * TanStack Query hooks for admin-facing user account management operations.
 */

export const ACCOUNTS_QUERY_KEY = ['accounts'];

/**
 * Returns a TanStack Query result for the full account list.
 */
export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccounts,
  });
}

/**
 * Returns a mutation for creating a new user account, invalidating the accounts cache on
 * success.
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountBody) => createAccount(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for archiving a user account by ID, invalidating the accounts cache on
 * success.
 */
export function useArchiveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for reactivating an archived account by ID, invalidating the accounts
 * cache on success.
 */
export function useReactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for permanently deleting an archived account by ID, invalidating the
 * accounts cache on success.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for changing a user account's role, invalidating the accounts cache on
 * success.
 */
export function useChangeAccountRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => changeAccountRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY }),
  });
}
