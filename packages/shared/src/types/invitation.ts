/**
 * Enum constants and TypeScript types for invitation lifecycle status values.
 */

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  CANCELLED: 'CANCELLED',
  SUPERSEDED: 'SUPERSEDED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];
