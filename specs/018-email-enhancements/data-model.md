# Data Model: Email Enhancements (018)

## No new database tables

This feature adds no new persisted entities. All three enhancements operate on existing data:

- The admin test email is ephemeral (no record kept).
- The welcome confirmation email is derived from the user row already created during
  `activateFromInvitation`.
- The email-change confirmation email is derived from the `email_verifications` row already
  read during `confirmEmailChange`.

---

## Changed service return type

### `ProfileService.confirmEmailChange`

**Current return type**:
```
'confirmed' | 'not-found' | 'expired'
```

**New return type**:
```
{ outcome: 'confirmed'; newEmail: string } | 'not-found' | 'expired'
```

The `new_email` value is already present on the `email_verifications` row that the method
reads before deleting it. Passing it through the return value avoids a second DB query in
the route handler.

**Downstream change**: `profile.ts` route handler must be updated to match: destructure
`result.newEmail` instead of checking `result === 'confirmed'`.

---

## New shared schema

### `SendTestEmailBodySchema` (added to `@pcm/shared`)

| Field  | Type              | Constraints       |
|--------|-------------------|-------------------|
| email  | string (email)    | valid RFC 5321 address, max 320 chars |

Added to `packages/shared/src/schemas/profile.ts` alongside the existing
`RequestEmailChangeBodySchema`, which has the same shape.

---

## New `MailerService` methods (no DB involvement)

| Method signature | Description |
|-----------------|-------------|
| `sendTestEmail(to: string): Promise<void>` | Sends a clearly labelled test/diagnostic email |
| `sendWelcomeEmail(to: string): Promise<void>` | Confirms to the new invitee that their account is active |
| `sendEmailChangeConfirmationEmail(to: string, changedAt: string): Promise<void>` | Confirms to the user that their email address was successfully updated |

All three methods follow the existing `sendMail` promise-wrapping pattern in `MailerService`
and throw `MailerError` on transport failure.
