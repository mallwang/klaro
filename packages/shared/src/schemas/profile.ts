import { z } from 'zod';

export const UpdateDisplayNameBodySchema = z.object({
  displayName: z.string().min(1).max(100),
});

export const RequestEmailChangeBodySchema = z.object({
  email: z.string().email().max(320),
});

export const PendingEmailChangeSchema = z.object({
  pendingEmail: z.string().email().nullable(),
});

export const SendTestEmailBodySchema = z.object({
  email: z.string().email().max(320),
});

export type UpdateDisplayNameBody = z.infer<typeof UpdateDisplayNameBodySchema>;
export type RequestEmailChangeBody = z.infer<typeof RequestEmailChangeBodySchema>;
export type PendingEmailChange = z.infer<typeof PendingEmailChangeSchema>;
export type SendTestEmailBody = z.infer<typeof SendTestEmailBodySchema>;
