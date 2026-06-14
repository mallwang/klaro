# Implementation Plan: Account Profile Settings

**Branch**: `017-account-profile-settings` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-account-profile-settings/spec.md`

## Summary

Extend the existing `/account` settings page so that any authenticated user can update their display name and initiate an email-address change (confirmed via a verification link sent to the new address). Separately, enhance the sidebar user widget to show an avatar icon, the user's name, and their role label. New backend: a `ProfileService`, a `email_verifications` SQLite table, a new `/api/profile` route group, and a `sendEmailVerificationEmail` method on the existing `MailerService`. New frontend: profile API service, enhanced `AccountSettings` page, a public email-confirmation route, and an updated sidebar footer.

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3, Node.js LTS (ESM)

**Primary Dependencies**: Fastify 5, better-sqlite3, nodemailer (already present); Mantine v7, TanStack Query v5, react-router-dom v7, Zod, react-i18next (already present)

**Storage**: SQLite via better-sqlite3; new `email_verifications` table added via inline migration in `runMigrations`

**Testing**: Vitest + @testing-library/react (unit & integration); Playwright (E2E, existing suite)

**Target Platform**: Browser (desktop + mobile responsive) + Node.js server

**Project Type**: Web application (monorepo: `packages/backend`, `packages/frontend`, `packages/shared`)

**Performance Goals**: No new performance requirements beyond existing baselines.

**Constraints**: No new npm dependencies. TypeScript strict mode must remain satisfied. Existing unit and E2E tests must not regress. Mailer is optional (feature degrades gracefully if SMTP not configured, same as invitations).

**Scale/Scope**: Three packages touched. One new DB table. Four new backend endpoints. Two modified frontend components. Two new frontend components/pages.

## Constitution Check

### Principle I: Test-First (NON-NEGOTIABLE)

**PASS** — Every new service method and route must have a failing test written and confirmed to fail before any implementation code is committed. Specifically:
- `ProfileService` unit tests (Vitest, `:memory:` SQLite) written before `ProfileService` exists.
- Integration tests for all four `/api/profile` routes written before `profileRoutes` is registered.
- Frontend unit tests for `AccountSettings` display-name and email-change forms written before the form JSX is added.
- Frontend unit test for `NavbarSegmented` role + avatar display written before the UI is changed.

### Principle II: Type Safety (NON-NEGOTIABLE)

**PASS** — All new shared Zod schemas (`UpdateDisplayNameBodySchema`, `RequestEmailChangeBodySchema`, `PendingEmailChangeSchema`) export inferred TypeScript types. New `EmailVerificationRow` interface added to `db/client.ts`. `ProfileService` methods have explicit return-type unions. No `any` introduced. `tsc --noEmit` must pass before merge.

### Principle III: Simplicity (YAGNI)

**PASS** — No new abstraction layers. `ProfileService` is a flat class following the existing `UserService`/`InvitationService` pattern. The `email_verifications` table uses a `UNIQUE` index on `user_id` as the "one pending per user" invariant (no status column needed — the row either exists or it doesn't). The frontend confirmation page is a thin component that POSTs on mount, matching the `AcceptInvitation` pattern.

## Project Structure

### Documentation (this feature)

```text
specs/017-account-profile-settings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── profile-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
packages/shared/
└── src/
    └── schemas/
        └── profile.ts              # NEW — UpdateDisplayNameBodySchema, RequestEmailChangeBodySchema, PendingEmailChangeSchema

packages/backend/
├── src/
│   ├── db/
│   │   ├── schema.sql              # unchanged — email_verifications table added via runMigrations migration
│   │   └── client.ts              # modified — runMigrations adds email_verifications table; EmailVerificationRow interface added
│   ├── services/
│   │   ├── profile.service.ts     # NEW — ProfileService: updateDisplayName, requestEmailChange, getPendingEmailChange, confirmEmailChange
│   │   └── mailer.service.ts      # modified — adds sendEmailVerificationEmail method
│   └── routes/
│       └── profile.ts             # NEW — PATCH /api/profile, POST /api/profile/email-change, GET /api/profile/email-change/pending, POST /api/profile/email-change/:token/confirm
│   └── server.ts                  # modified — register profileRoutes; add confirm endpoint to PUBLIC_ROUTES
└── tests/
    ├── unit/
    │   └── profile.service.test.ts  # NEW
    └── integration/
        └── profile.route.test.ts    # NEW

packages/frontend/
├── src/
│   ├── services/
│   │   └── profile.ts             # NEW — updateDisplayName, requestEmailChange, getPendingEmailChange, confirmEmailChange fetch wrappers
│   ├── pages/
│   │   ├── AccountSettings.tsx    # modified — add display name section, email change section
│   │   └── EmailVerifyConfirm.tsx # NEW — public page: auto-POSTs confirm on mount, shows result
│   └── components/AppShell/
│       └── NavbarSegmented.tsx    # modified — user section enhanced with Avatar + role label
│   └── main.tsx                   # modified — add /email-change/confirm/:token route (outside RequireAuth)
└── tests/
    └── unit/
        ├── AccountSettings.test.tsx  # NEW
        └── AppShell.test.tsx         # modified — add assertions for role label and avatar in navbar
```

## Implementation Tasks

### Task 1 — Shared: New Profile Schemas (TDD: RED then GREEN)

Write schemas in `packages/shared/src/schemas/profile.ts` and export from `packages/shared/src/index.ts`:

```text
UpdateDisplayNameBodySchema: { displayName: string (min 1, max 100) }
RequestEmailChangeBodySchema: { email: string (email format, max 320) }
PendingEmailChangeSchema: { pendingEmail: string | null }
```

Tests: Import and parse with Vitest to confirm validation boundaries (empty name rejected, email format enforced).

---

### Task 2 — Backend DB: email_verifications Table

Add to `runMigrations` in `packages/backend/src/db/client.ts`:

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email   TEXT NOT NULL CHECK(length(new_email) <= 320),
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_user
  ON email_verifications(user_id);
```

Add `EmailVerificationRow` interface to `client.ts`:

```typescript
export interface EmailVerificationRow {
  token: string;
  user_id: string;
  new_email: string;
  expires_at: string;
  created_at: string;
}
```

No separate test needed — `runMigrations` is exercised by every integration test's `beforeEach`.

---

### Task 3 — Backend: ProfileService (TDD: RED → GREEN → REFACTOR)

Write failing unit tests in `tests/unit/profile.service.test.ts` first, then implement `src/services/profile.service.ts`.

**Methods to implement**:

```typescript
updateDisplayName(userId: string, displayName: string): 'updated' | 'not-found'
```
- Updates `users.display_name` for the given user.
- Returns `'not-found'` if the user ID does not exist.

```typescript
requestEmailChange(userId: string, newEmail: string): RequestEmailChangeResult
// type: { outcome: 'requested'; token: string; expiresAt: string } | { outcome: 'duplicate' } | { outcome: 'not-found' }
```
- Checks that `newEmail` is not already in use by any active account (case-insensitive).
- Generates `randomBytes(32).toString('hex')` token; expiry = now + 24 hours.
- Deletes any existing row for this `user_id`, then inserts new row (within a transaction to handle the unique index).
- Returns token + expiresAt for the caller to pass to the mailer.

```typescript
getPendingEmailChange(userId: string): { pendingEmail: string } | null
```
- Returns the pending new email if a non-expired row exists for this user, else `null`.

```typescript
confirmEmailChange(token: string): ConfirmEmailChangeResult
// type: 'confirmed' | 'not-found' | 'expired' | 'already-used'
```
- Looks up the token row.
- If not found: `'not-found'`.
- If expired (`expires_at < now`): deletes the row and returns `'expired'`.
- If valid: within a transaction, updates `users.email` and deletes the token row.
- Note: `'already-used'` is returned for the non-found case after confirmation completes on a second click (the row is gone).

**Unit test coverage** (all written before implementation):
- `updateDisplayName` with valid user → 'updated', DB reflects new name
- `updateDisplayName` with unknown user → 'not-found'
- `requestEmailChange` for available email → 'requested', row inserted
- `requestEmailChange` re-request supersedes old token (old row deleted, new inserted)
- `requestEmailChange` for email already used by another active user → 'duplicate'
- `getPendingEmailChange` returns pending email for fresh token
- `getPendingEmailChange` returns null if expired
- `getPendingEmailChange` returns null if no pending row
- `confirmEmailChange` with valid token → 'confirmed', email updated in users table, token row deleted
- `confirmEmailChange` with expired token → 'expired'
- `confirmEmailChange` with unknown token → 'not-found'

---

### Task 4 — Backend: MailerService Extension

Add to `packages/backend/src/services/mailer.service.ts`:

```typescript
async sendEmailVerificationEmail(to: string, link: string, expiresAt: string): Promise<void>
```

Email body: Informs the user that their email address change was requested and provides the verification link (expires in 24 hours). Uses the same nodemailer pattern as `sendInvitationEmail`.

No separate unit test needed — mailer is tested via integration tests with a mock transport (existing pattern from invitation tests).

---

### Task 5 — Backend: Profile Routes (TDD: RED → GREEN)

Write failing integration tests in `tests/integration/profile.route.test.ts` first, then implement `src/routes/profile.ts`.

**Endpoints**:

```
PATCH /api/profile
```
- Requires authentication (any role).
- Body: `{ displayName: string }` validated via `UpdateDisplayNameBodySchema`.
- 204 No Content on success.
- 400 if validation fails.
- 404 if user not found (defensive, should not occur with valid session).

```
POST /api/profile/email-change
```
- Requires authentication (any role).
- Body: `{ email: string }` validated via `RequestEmailChangeBodySchema`.
- Calls `ProfileService.requestEmailChange`, then `MailerService.sendEmailVerificationEmail`.
- 202 Accepted with body `{ message: 'Verification email sent' }` on success.
- 409 Conflict if email already in use.
- 400 if validation fails.
- 502 if mailer fails (rolls back: deletes the token row).

```
GET /api/profile/email-change/pending
```
- Requires authentication (any role).
- Returns `{ pendingEmail: string | null }`.

```
POST /api/profile/email-change/:token/confirm
```
- **Public** (no authentication required).
- 200 OK with `{ message: 'Email address updated successfully' }` on 'confirmed'.
- 410 Gone for 'expired'.
- 404 Not Found for 'not-found'.

**Integration test coverage** (written before routes exist):
- PATCH /api/profile → 204 for valid body; name updated in DB; 400 for empty name
- PATCH /api/profile without auth → 401
- POST /api/profile/email-change → 202, token row created; 409 for duplicate; 400 for invalid format
- GET /api/profile/email-change/pending → returns pending email; null when none
- POST /api/profile/email-change/:token/confirm → 200 confirmed; 410 expired; 404 unknown token; public (no session needed)

---

### Task 6 — Backend: Register Routes & Public Route

In `packages/backend/src/server.ts`:

1. Import and register `profileRoutes`:
   ```typescript
   import { profileRoutes } from './routes/profile.js';
   // ...
   await fastify.register(profileRoutes);
   ```

2. Add the confirm endpoint to `PUBLIC_ROUTES`:
   ```typescript
   (m, p) => m === 'POST' && /^\/api\/profile\/email-change\/[^/]+\/confirm$/.test(p),
   ```

---

### Task 7 — Frontend: Profile Service

Create `packages/frontend/src/services/profile.ts` with typed fetch wrappers (following the pattern in `auth.ts` and `users.ts`):

```typescript
updateDisplayName(displayName: string): Promise<void>
requestEmailChange(email: string): Promise<void>
getPendingEmailChange(): Promise<{ pendingEmail: string | null }>
confirmEmailChange(token: string): Promise<void>
```

---

### Task 8 — Frontend: AccountSettings.tsx (TDD: RED → GREEN)

Write failing unit tests in `tests/unit/AccountSettings.test.tsx` first, then extend the existing `AccountSettings` page.

**New sections** (added above the existing Change Password section):

**Display Name section** (`<Paper>`):
- Text input pre-filled with `user?.displayName` (from `useCurrentUser()` query).
- Save button → calls `updateDisplayName`, then `queryClient.invalidateQueries(CURRENT_USER_QUERY_KEY)` on success so the sidebar updates immediately.
- Success alert: "Display name updated."
- Error alert on failure.

**Email Address section** (`<Paper>`):
- Shows current email (read-only display).
- If `getPendingEmailChange` returns a non-null `pendingEmail`, shows a notice: "Waiting for verification at [new email]. Check your inbox."
- Text input for new email address.
- Submit button → calls `requestEmailChange`, shows "Check your inbox" confirmation on 202 response.
- 409 conflict shown as inline error.

**Unit test coverage** (written before implementation):
- Renders display name input pre-filled with current user's name
- Submitting valid display name calls `updateDisplayName` and shows success message
- Submitting empty display name does not call the API (client-side validation)
- Renders current email as read-only
- Renders pending verification notice when pending email present
- Submitting valid new email calls `requestEmailChange` and shows "check inbox" message
- 409 response shown as conflict error

---

### Task 9 — Frontend: NavbarSegmented.tsx (TDD: RED → GREEN)

Extend failing test in `tests/unit/AppShell.test.tsx` first, then modify `NavbarSegmented`.

**Change**: Replace the plain text display name in the `userSection` with:

```tsx
<Group gap="xs" align="center" style={{ overflow: 'hidden' }}>
  <Avatar size="sm" radius="xl" color="teal">
    <IconUser size={14} />
  </Avatar>
  <div style={{ overflow: 'hidden' }}>
    <Text size="sm" fw={500} truncate>
      {user?.displayName}
    </Text>
    <Text size="xs" c="dimmed">
      {user?.role === 'ADMIN' ? t('nav.roleAdmin') : t('nav.roleMember')}
    </Text>
  </div>
</Group>
```

Add `Avatar` to Mantine imports. Add `nav.roleAdmin`/`nav.roleMember` i18n keys.

**Unit test** (written before change):
- Renders avatar element in user section
- Renders role label "Admin" for ADMIN user
- Renders role label "Member" for MEMBER user

---

### Task 10 — Frontend: EmailVerifyConfirm.tsx (TDD: RED → GREEN)

Write unit test first, then create the new public page.

Pattern: mirrors `AcceptInvitation.tsx` — reads token from router params, calls `confirmEmailChange` on mount, shows success/error/loading states.

**States**:
- Loading: spinner while request in flight.
- Success (200): "Your email address has been updated. [Sign in / Go to dashboard] button."
- Expired (410): "This link has expired."
- Not found (404): "This link is not valid."

**Unit test** (written before implementation):
- Shows loading state initially
- Shows success message after confirm resolves
- Shows expired message after 410 error

---

### Task 11 — Frontend: main.tsx Router

Add new public route alongside `/invitations/:token`:

```tsx
<Route path="/email-change/confirm/:token" element={<EmailVerifyConfirm />} />
```

No test needed beyond the existing router integration test (the route registration is a one-liner).

---

### Task 12 — Frontend: i18n Translation Keys

Add keys to the English locale file (and any other locale files present) for:
- `accountSettings.displayNameLabel`
- `accountSettings.displayNameSuccess`
- `accountSettings.emailSectionTitle`
- `accountSettings.pendingEmailNotice`
- `accountSettings.newEmailLabel`
- `accountSettings.emailChangeSubmitLabel`
- `accountSettings.emailChangeSent`
- `accountSettings.emailChangeConflict`
- `nav.roleAdmin`
- `nav.roleMember`
- `emailVerify.loading`
- `emailVerify.success`
- `emailVerify.expired`
- `emailVerify.notFound`

## Complexity Tracking

> No constitution violations — no entries needed.
