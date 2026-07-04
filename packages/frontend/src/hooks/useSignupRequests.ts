import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SignupRequest, CreateSignupRequestBody } from '@pcm/shared';
import {
  listSignupRequests,
  submitSignup,
  verifySignup,
  approveSignupRequest,
  rejectSignupRequest,
  deleteSignupRequest,
} from '../services/signup.js';

/**
 * TanStack Query hooks for the public self-service sign-up lifecycle: submit, verify, and
 * admin review (list/approve/reject/delete).
 */

export const SIGNUP_REQUESTS_QUERY_KEY = ['signup-requests'];

/**
 * Returns a mutation for submitting a new public sign-up request.
 */
export function useSubmitSignup() {
  return useMutation({
    mutationFn: (body: CreateSignupRequestBody) => submitSignup(body),
  });
}

/**
 * Returns a mutation for verifying a sign-up request by token.
 */
export function useVerifySignup() {
  return useMutation({
    mutationFn: (token: string) => verifySignup(token),
  });
}

/**
 * Returns a TanStack Query result for the full sign-up request list.
 */
export function useSignupRequests() {
  return useQuery<SignupRequest[]>({
    queryKey: SIGNUP_REQUESTS_QUERY_KEY,
    queryFn: listSignupRequests,
  });
}

/**
 * Returns a mutation for approving a verified sign-up request, invalidating the sign-up
 * requests and accounts caches on success.
 */
export function useApproveSignupRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => approveSignupRequest(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIGNUP_REQUESTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Returns a mutation for rejecting a verified sign-up request, invalidating the sign-up
 * requests cache on success.
 */
export function useRejectSignupRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, reason }: { token: string; reason?: string }) =>
      rejectSignupRequest(token, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SIGNUP_REQUESTS_QUERY_KEY }),
  });
}

/**
 * Returns a mutation for deleting a sign-up request entry, invalidating the sign-up requests
 * cache on success.
 */
export function useDeleteSignupRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => deleteSignupRequest(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SIGNUP_REQUESTS_QUERY_KEY }),
  });
}
