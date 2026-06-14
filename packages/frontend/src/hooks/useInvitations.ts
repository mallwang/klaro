import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Invitation, SendInvitationBody } from '@pcm/shared';
import {
  listInvitations,
  sendInvitation,
  cancelInvitation,
  resendInvitation,
} from '../services/invitations.js';

/**
 * TanStack Query hooks for admin invitation management: list, send, cancel, and resend.
 */

export const INVITATIONS_QUERY_KEY = ['invitations'];

/**
 * Returns a TanStack Query result for the full invitation list.
 */
export function useInvitations() {
  return useQuery<Invitation[]>({
    queryKey: INVITATIONS_QUERY_KEY,
    queryFn: listInvitations,
  });
}

/**
 * Returns a mutation for sending a new invitation, invalidating the invitations cache on
 * success.
 */
export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendInvitationBody) => sendInvitation(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for cancelling a pending invitation by token, invalidating the
 * invitations cache on success.
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => cancelInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for resending a pending invitation by token, invalidating the
 * invitations cache on success.
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => resendInvitation(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
  });
}
