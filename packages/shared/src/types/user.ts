/**
 * Enum constants and TypeScript types for user roles, account status values, and the User
 * domain object.
 */

export const Role = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const AccountStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

export type EmailSummaryFrequency = 'WEEKLY' | 'MONTHLY';

export interface NotificationPreferences {
  summaryEmailEnabled: boolean;
  summaryEmailFrequency: EmailSummaryFrequency | null;
  /** ISO 8601 UTC datetime; null when summary email is disabled */
  nextSendAt: string | null;
}

export type CtaState = 'cancellation-due' | 'no-contracts' | 'none';

export interface SummaryContractRow {
  name: string;
  billingInterval: string;
  monthlyCost: number;
  anonymize: boolean;
}

export interface SummaryRenewalRow {
  name: string;
  endDate: string;
  cancellationDeadline: string;
  daysUntilDeadline: number;
  anonymize: boolean;
}

export interface SummaryEmailData {
  userEmail: string;
  displayName: string;
  frequency: EmailSummaryFrequency;
  totalMonthlySpending: number;
  contracts: SummaryContractRow[];
  upcomingRenewals: SummaryRenewalRow[];
  ctaState: CtaState;
  dashboardUrl: string;
}
