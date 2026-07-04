/**
 * Enum constants and TypeScript types for sign-up request lifecycle status values.
 */

export const SignupRequestStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  REJECTED: 'REJECTED',
} as const;

export type SignupRequestStatus = (typeof SignupRequestStatus)[keyof typeof SignupRequestStatus];
