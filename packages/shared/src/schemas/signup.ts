import { z } from 'zod';
import { SignupRequestStatus } from '../types/signup.js';

/**
 * Zod schemas and inferred TypeScript types for public self-service sign-up requests and
 * admin decision payloads.
 */

const SignupRequestStatusEnum = z.enum([
  SignupRequestStatus.UNVERIFIED,
  SignupRequestStatus.PENDING_REVIEW,
  SignupRequestStatus.REJECTED,
]);

export const SignupRequestSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  status: SignupRequestStatusEnum,
  createdAt: z.string(),
  verificationExpiresAt: z.string(),
  verifiedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  decidedAt: z.string().nullable(),
});

export const CreateSignupRequestBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const RejectSignupRequestBodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type CreateSignupRequestBody = z.infer<typeof CreateSignupRequestBodySchema>;
export type RejectSignupRequestBody = z.infer<typeof RejectSignupRequestBodySchema>;
