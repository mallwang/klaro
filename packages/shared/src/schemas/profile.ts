import { z } from 'zod';

/**
 * Zod schemas and inferred TypeScript types for user profile actions, including display name
 * updates, email change requests, account deletion results, and notification preferences.
 */

export const DeleteSelfResultSchema = z.union([z.literal('deleted'), z.literal('last-admin')]);
export type DeleteSelfResult = z.infer<typeof DeleteSelfResultSchema>;

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

export const UpdateNotificationPreferencesBodySchema = z
  .object({
    summaryEmailEnabled: z.boolean(),
    summaryEmailFrequency: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.summaryEmailEnabled && !val.summaryEmailFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'summaryEmailFrequency is required when summaryEmailEnabled is true',
        path: ['summaryEmailFrequency'],
      });
    }
  });

export type UpdateNotificationPreferencesBody = z.infer<
  typeof UpdateNotificationPreferencesBodySchema
>;
