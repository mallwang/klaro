# Tasks: Forgot Password (021)

## Task 1: Add `purpose` column to `email_verifications` table

**Priority**: P1 (blocker for all other tasks)

**Description**: Extend the `email_verifications` table with a `purpose` column to distinguish email-change tokens from password-reset tokens. Update the unique index to include purpose.

**Files to modify**:
- `packages/backend/src/db/client.ts` — add migration in `runMigrations`
- `packages/backend/src/db/client.ts` — update `EmailVerificationRow` interface

**Tests to write first**:
- `packages/backend/tests/unit/migration.test.ts` — verify migration adds `purpose` column

**Acceptance criteria**:
- [X] `purpose` column exists with default `'email-change'`
- [X] Unique index includes `purpose`
- [X] Existing rows have `purpose = 'email-change'`
- [X] `EmailVerificationRow` interface includes `purpose` field
- [X] All existing tests still pass

---

## Task 2: Add shared Zod schemas for password reset

**Priority**: P1 (blocker for backend and frontend)

**Description**: Add `RequestPasswordResetBodySchema` and `ResetPasswordBodySchema` to the shared package.

**Files to modify**:
- `packages/shared/src/schemas/auth.ts` — add new schemas
- `packages/shared/src/index.ts` — verify exports (should work automatically)

**Tests to write first**:
- `packages/shared/tests/unit/schemas.test.ts` — verify schema validation

**Acceptance criteria**:
- [X] `RequestPasswordResetBodySchema` validates email
- [X] `ResetPasswordBodySchema` validates password (min 8, max 200)
- [X] Types are exported correctly
- [X] Existing schema tests still pass

---

## Task 3: Add `sendPasswordResetEmail` to `MailerService`

**Priority**: P1 (blocker for email sending)

**Description**: Add a new email method for sending password reset links.

**Files to modify**:
- `packages/backend/src/services/mailer.service.ts` — add `sendPasswordResetEmail`

**Tests to write first**:
- `packages/backend/tests/unit/mailer.service.test.ts` — verify email sends correctly

**Acceptance criteria**:
- [X] Method sends email with correct subject and content
- [X] Method throws `MailerError` on transport failure
- [X] Method follows existing promise-wrapping pattern
- [X] JSDoc comment is present

---

## Task 4: Add password reset methods to `AuthService`

**Priority**: P1 (core business logic)

**Description**: Add `requestPasswordReset` and `resetPassword` methods to handle the password reset flow.

**Files to modify**:
- `packages/backend/src/services/auth.service.ts` — add new methods

**Tests to write first**:
- `packages/backend/tests/unit/auth.service.test.ts` — verify service methods

**Acceptance criteria**:
- [X] `requestPasswordReset` generates token and stores in DB
- [X] `requestPasswordReset` invalidates previous tokens for user
- [X] `requestPasswordReset` returns success even for non-existent email
- [X] `resetPassword` updates password hash and salt
- [X] `resetPassword` deletes token after use
- [X] `resetPassword` returns 'not-found' for invalid token
- [X] `resetPassword` returns 'expired' for expired token
- [X] JSDoc comments are present

---

## Task 5: Add public API routes for password reset

**Priority**: P1 (backend endpoints)

**Description**: Add `POST /api/auth/forgot-password` and `POST /api/auth/reset-password/:token` routes.

**Files to modify**:
- `packages/backend/src/routes/auth.ts` — add new routes
- `packages/backend/src/server.ts` — add public routes to whitelist

**Tests to write first**:
- `packages/backend/tests/integration/auth.route.test.ts` — verify endpoint behavior

**Acceptance criteria**:
- [X] `POST /api/auth/forgot-password` returns 202 with generic message
- [X] `POST /api/auth/forgot-password` returns 400 for invalid email
- [X] `POST /api/auth/forgot-password` sends email when user exists
- [X] `POST /api/auth/forgot-password` does not send email when user not found
- [X] `POST /api/auth/reset-password/:token` returns 200 on success
- [X] `POST /api/auth/reset-password/:token` returns 400 for weak password
- [X] `POST /api/auth/reset-password/:token` returns 404 for invalid token
- [X] `POST /api/auth/reset-password/:token` returns 410 for expired token
- [X] Token is single-use (second attempt fails)
- [X] Public routes are whitelisted

---

## Task 6: Add frontend API client functions

**Priority**: P1 (frontend integration)

**Description**: Add `requestPasswordReset` and `resetPassword` functions to the frontend auth service.

**Files to modify**:
- `packages/frontend/src/services/auth.ts` — add new functions

**Tests to write first**:
- `packages/frontend/tests/unit/auth.service.test.ts` — verify API calls

**Acceptance criteria**:
- [X] `requestPasswordReset` sends POST to `/api/auth/forgot-password`
- [X] `resetPassword` sends POST to `/api/auth/reset-password/:token`
- [X] Both functions throw `AuthError` on failure
- [X] JSDoc comments are present

---

## Task 7: Add frontend hooks for password reset

**Priority**: P1 (frontend integration)

**Description**: Add `useRequestPasswordReset` and `useResetPassword` TanStack Query hooks.

**Files to modify**:
- `packages/frontend/src/hooks/useAuth.ts` — add new hooks

**Tests to write first**:
- `packages/frontend/tests/unit/hooks/useAuth.test.ts` — verify hook behavior

**Acceptance criteria**:
- [X] `useRequestPasswordReset` returns mutation for forgot-password endpoint
- [X] `useResetPassword` returns mutation for reset-password endpoint
- [X] Hooks follow existing patterns

---

## Task 8: Add `ForgotPassword` page

**Priority**: P1 (frontend UI)

**Description**: Create the email entry form page for requesting a password reset.

**Files to create**:
- `packages/frontend/src/pages/ForgotPassword.tsx`

**Tests to write first**:
- `packages/frontend/tests/unit/pages/ForgotPassword.test.tsx` — verify page renders and submits

**Acceptance criteria**:
- [X] Page renders email form with title "Reset your password"
- [X] Form validates email format
- [X] Success message appears after submission
- [X] Page uses `PublicLayout`
- [X] JSDoc comment is present

---

## Task 9: Add `ResetPassword` page

**Priority**: P1 (frontend UI)

**Description**: Create the password entry form page for setting a new password.

**Files to create**:
- `packages/frontend/src/pages/ResetPassword.tsx`

**Tests to write first**:
- `packages/frontend/tests/unit/pages/ResetPassword.test.tsx` — verify page renders and submits

**Acceptance criteria**:
- [X] Page renders password form with title "Set a new password"
- [X] Form validates password length (min 8)
- [X] Form validates password confirmation
- [X] Success message appears after submission
- [X] Error messages for invalid/expired tokens
- [X] Page uses `PublicLayout`
- [X] JSDoc comment is present

---

## Task 10: Update `SignIn` page with "Forgot password?" link

**Priority**: P1 (frontend UI)

**Description**: Add a "Forgot password?" link to the sign-in page.

**Files to modify**:
- `packages/frontend/src/pages/SignIn.tsx` — add link

**Tests to write first**:
- `packages/frontend/tests/unit/pages/SignIn.test.tsx` — verify link exists and navigates

**Acceptance criteria**:
- [X] "Forgot password?" link appears below the form
- [X] Link navigates to `/forgot-password`
- [X] Link is accessible (proper keyboard navigation)

---

## Task 11: Add routes to `main.tsx`

**Priority**: P1 (frontend routing)

**Description**: Add `/forgot-password` and `/reset-password/:token` routes to the app.

**Files to modify**:
- `packages/frontend/src/main.tsx` — add routes

**Tests to write first**:
- `packages/frontend/tests/unit/main.test.tsx` — verify routes are registered

**Acceptance criteria**:
- [X] `/forgot-password` route renders `ForgotPassword`
- [X] `/reset-password/:token` route renders `ResetPassword`
- [X] Routes are public (no auth required)

---

## Task 12: Add i18n translation keys

**Priority**: P1 (localization)

**Description**: Add translation keys for the forgot password and reset password flows.

**Files to modify**:
- `packages/frontend/src/i18n/locales/en.json` — add English translations
- `packages/frontend/src/i18n/locales/de.json` — add German translations

**Tests to write first**:
- `packages/frontend/tests/unit/i18n/catalogue.test.ts` — verify keys exist

**Acceptance criteria**:
- [X] English translations are complete
- [X] German translations are complete
- [X] Both files remain consistent

---

## Task 13: Update README and user guide

**Priority**: P2 (documentation)

**Description**: Update documentation to reflect the new forgot password feature.

**Files to modify**:
- `README.md` — add feature description
- `README.de.md` — add feature description (German)
- `docs/user-guide.md` — add user guide section
- `docs/user-guide.de.md` — add user guide section (German)

**Tests to write first**: N/A (documentation)

**Acceptance criteria**:
- [X] Feature is documented in English README
- [X] Feature is documented in German README
- [X] User guide includes step-by-step instructions
- [X] German user guide matches English version
