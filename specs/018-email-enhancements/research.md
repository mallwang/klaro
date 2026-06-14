# Research: Email Enhancements (018)

## 1. Fire-and-forget email after account actions

**Decision**: Send post-activation and post-email-change confirmation emails using
fire-and-forget semantics: attempt the send, log errors, and never block or roll back the
primary operation.

**Rationale**: The existing codebase already uses this pattern for mailer errors in
`invitations.ts` (invitation email fails → invitation is deleted and 502 is returned), but
the welcome and confirmation emails are lower-priority than the primary action — the account
is already active or the email is already changed by the time these run. Blocking or rolling
back the core action because a transactional email failed is worse UX than a silent log entry.

**Alternatives considered**: Queuing emails in a background job for retry. Rejected because
the project runs as a single Node process without a job queue, and adding one would violate
Principle III (YAGNI).

---

## 2. Return the new email address from `ProfileService.confirmEmailChange`

**Decision**: Change `ConfirmEmailChangeResult` from `'confirmed' | 'not-found' | 'expired'`
to `{ outcome: 'confirmed'; newEmail: string } | 'not-found' | 'expired'`. The `new_email`
column is already present on the `email_verifications` row read at the top of the method.

**Rationale**: The route handler needs the confirmed email address to send the confirmation
email. Passing it through the service return value is the simplest approach; the alternative
(a second DB query from the route) would read data already available in the service.

**Alternatives considered**: Adding a separate `getEmailForUser()` call in the route. Rejected
because it reads data the service already has, adds a round-trip, and complicates the route.

---

## 3. Location of admin test-email endpoint

**Decision**: New route registered alongside other admin-only routes in a new file
`packages/backend/src/routes/admin.ts`, using the same ADMIN role guard pattern as
`users.ts` (`onRequest` hook that returns 403 for non-admins).

**Rationale**: Keeping it separate from `profile.ts` (which is per-user, not admin) and from
`users.ts` (which is user-management, not email config) maintains single-responsibility
grouping. A dedicated `admin.ts` file also leaves room for future admin utilities without
polluting existing route files.

**Alternatives considered**: Appending to `users.ts`. Rejected because email testing is
semantically different from user management.

---

## 4. Schema placement for `SendTestEmailBodySchema`

**Decision**: Add `SendTestEmailBodySchema` to `packages/shared/src/schemas/profile.ts`
(reusing the existing email string validation pattern already there).

**Rationale**: No new shared file is needed; this is a small addition. The profile schemas
already have `z.string().email()` for `RequestEmailChangeBodySchema`. Sharing the schema
ensures the frontend and backend validate identically.

**Alternatives considered**: A new `admin.ts` schema file in `@pcm/shared`. Rejected because
the overhead of a new file outweighs the benefit for a single schema object (YAGNI).

---

## 5. UI placement for test-email action

**Decision**: Add a "Test email delivery" section to the existing `AccountsAdmin.tsx` page
(rendered beneath the invite form, above the invitations table). The recipient email input
pre-fills with the signed-in admin's own email address but is editable.

**Rationale**: `AccountsAdmin.tsx` is the only admin-only page; placing the test tool there
avoids a new route and keeps all admin utilities together. Pre-filling with the admin's own
email is the most useful default — they can immediately verify delivery to themselves.

**Alternatives considered**: A dedicated `/admin/settings` page. Rejected because no such
page exists yet, and creating one for a single form violates YAGNI.

---

## 6. New `MailerService` methods needed

Three new methods:

| Method | Trigger | To address |
|--------|---------|-----------|
| `sendTestEmail(to)` | Admin test action | admin-specified address |
| `sendWelcomeEmail(to)` | After invitation accepted | invitee's address |
| `sendEmailChangeConfirmationEmail(to, changedAt)` | After email change confirmed | new (now active) address |

All follow the same `sendMail` promise-wrapping pattern used by existing methods.
No new dependencies are needed.
