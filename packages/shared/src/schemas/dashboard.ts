import { z } from 'zod';
import { Category } from '../types/contract.js';

/**
 * Zod schemas and inferred TypeScript types for the dashboard API response, including spending
 * summaries, upcoming renewals, and expired contracts.
 */

const CategoryEnum = z.enum([
  Category.UTILITIES,
  Category.SUBSCRIPTIONS,
  Category.INSURANCE,
  Category.HOUSING,
  Category.OTHER,
]);

export const CategorySummarySchema = z.object({
  category: CategoryEnum,
  label: z.string(),
  count: z.number().int().nonnegative(),
  monthlyTotal: z.number().nonnegative(),
});

export const UpcomingRenewalSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cancellationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysUntilCancellationDeadline: z.number().int(),
  anonymize: z.boolean(),
  logoName: z.string().nullable(),
  useGenericIcon: z.boolean(),
});

export const ExpiredContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysOverdue: z.number().int().positive(),
  anonymize: z.boolean(),
  logoName: z.string().nullable(),
  useGenericIcon: z.boolean(),
});

export const InactiveContractSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: CategoryEnum,
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  anonymize: z.boolean(),
  logoName: z.string().nullable(),
  useGenericIcon: z.boolean(),
});

export const DashboardResponseSchema = z.object({
  totalMonthlySpending: z.number().nonnegative(),
  contractsByCategory: z.array(CategorySummarySchema),
  upcomingRenewals: z.array(UpcomingRenewalSchema),
  expiredContracts: z.array(ExpiredContractSchema),
  inactiveContracts: z.array(InactiveContractSchema),
});

export type CategorySummary = z.infer<typeof CategorySummarySchema>;
export type UpcomingRenewal = z.infer<typeof UpcomingRenewalSchema>;
export type ExpiredContract = z.infer<typeof ExpiredContractSchema>;
export type InactiveContract = z.infer<typeof InactiveContractSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
