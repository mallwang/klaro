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
- [ ] `purpose` column exists with default `'email-change'`
- [ ] Unique index includes `purpose`
- [ ] Existing rows have `purpose = 'email-change'`
- [ ] `EmailVerificationRow` interface includes `purpose` field
- [ ] All existing tests still pass

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
- [ ] `RequestPasswordResetBodySchema` validates email
- [ ] `ResetPasswordBodySchema` validates password (min 8, max 200)
- [ ] Types are exported correctly
- [ ] Existing schema tests still pass

---

## Task 3: Add `sendPasswordResetEmail` to `MailerService`

**Priority**: P1 (blocker for email sending)

**Description**: Add a new email method for sending password reset links.

**Files to modify**:
- `packages/backend/src/services/mailer.service.ts` — add `sendPasswordResetEmail`

**Tests to write first**:
- `packages/backend/tests/unit/mailer.service.test.ts` — verify email sends correctly

**Acceptance criteria**:
- [ ] Method sends email with correct subject and content
- [ ] Method throws `MailerError` on transport failure
- [ ] Method follows existing promise-wrapping pattern
- [ ] JSDoc comment is present

---

## Task 4: Add password reset methods to `AuthService`

**Priority**: P1 (core business logic)

**Description**: Add `requestPasswordReset` and `resetPassword` methods to handle the password reset flow.

**Files to modify**:
- `packages/backend/src/services/auth.service.ts` — add new methods

**Tests to write first**:
- `packages/backend/tests/unit/auth.service.test.ts` — verify service methods

**Acceptance criteria**:
- [ ] `requestPasswordReset` generates token and stores in DB
- [ ] `requestPasswordReset` invalidates previous tokens for user
- [ ] `requestPasswordReset` returns success even for non-existent email
- [ ] `resetPassword` updates password hash and salt
- [ ] `resetPassword` deletes token after use
- [ ] `resetPassword` returns 'not-found' for invalid token
- [ ] `resetPassword` returns 'expired' for expired token
- [ ] JSDoc comments are present

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
- [ ] `POST /api/auth/forgot-password` returns 202 with generic message
- [ ] `POST /api/auth/forgot-password` returns 400 for invalid email
- [ ] `POST /api/auth/forgot-password` sends email when user exists
- [ ] `POST /api/auth/forgot-password` does not send email when user not found
- [ ] `POST /api/auth/reset-password/:token` returns 200 on success
- [ ] `POST /api/auth/reset-password/:token` returns 400 for weak password
- [ ] `POST /api/auth/reset-password/:token` returns 404 for invalid token
- [ ] `POST /api/auth/reset-password/:token` returns 410 for expired token
- [ ] Token is single-use (second attempt fails)
- [ ] Public routes are whitelisted

---

## Task 6: Add frontend API client functions

**Priority**: P1 (frontend integration)

**Description**: Add `requestPasswordReset` and `resetPassword` functions to the frontend auth service.

**Files to modify**:
- `packages/frontend/src/services/auth.ts` — add new functions

**Tests to write first**:
- `packages/frontend/tests/unit/auth.service.test.ts` — verify API calls

**Acceptance criteria**:
- [ ] `requestPasswordReset` sends POST to `/api/auth/forgot-password`
- [ ] `resetPassword` sends POST to `/api/auth/reset-password/:token`
- [ ] Both functions throw `AuthError` on failure
- [ ] JSDoc comments are present

---

## Task 7: Add frontend hooks for password reset

**Priority**: P1 (frontend integration)

**Description**: Add `useRequestPasswordReset` and `useResetPassword` TanStack Query hooks.

**Files to modify**:
- `packages/frontend/src/hooks/useAuth.ts` — add new hooks

**Tests to write first**:
- `packages/frontend/tests/unit/hooks/useAuth.test.ts` — verify hook behavior

**Acceptance criteria**:
- [ ] `useRequestPasswordReset` returns mutation for forgot-password endpoint
- [ ] `useResetPassword` returns mutation for reset-password endpoint
- [ ] Hooks follow existing patterns

---

## Task 8: Add `ForgotPassword` page

**Priority**: P1 (frontend UI)

**Description**: Create the email entry form page for requesting a password reset.

**Files to create**:
- `packages/frontend/src/pages/ForgotPassword.tsx`

**Tests to write first**:
- `packages/frontend/tests/unit/pages/ForgotPassword.test.tsx` — verify page renders and submits

**Acceptance criteria**:
- [ ] Page renders email form with title "Reset your password"
- [ ] Form validates email format
- [ ] Success message appears after submission
- [ ] Page uses `PublicLayout`
- [ ] JSDoc comment is present

---

## Task 9: Add `ResetPassword` page

**Priority**: P1 (frontend UI)

**Description**: Create the password entry form page for setting a new password.

**Files to create**:
- `packages/frontend/src/pages/ResetPassword.tsx`

**Tests to write first**:
- `packages/frontend/tests/unit/pages/ResetPassword.test.tsx` — verify page renders and submits

**Acceptance criteria**:
- [ ] Page renders password form with title "Set a new password"
- [ ] Form validates password length (min 8)
- [ ] Form validates password confirmation
- [ ] Success message appears after submission
- [ ] Error messages for invalid/expired tokens
- [ ] Page uses `PublicLayout`
- [ ] JSDoc comment is present

---

## Task 10: Update `SignIn` page with "Forgot password?" link

**Priority**: P1 (frontend UI)

**Description**: Add a "Forgot password?" link to the sign-in page.

**Files to modify**:
- `packages/frontend/src/pages/SignIn.tsx` — add link

**Tests to write first**:
- `packages/frontend/tests/unit/pages/SignIn.test.tsx` — verify link exists and navigates

**Acceptance criteria**:
- [ ] "Forgot password?" link appears below the form
- [ ] Link navigates to `/forgot-password`
- [ ] Link is accessible (proper keyboard navigation)

---

## Task 11: Add routes to `main.tsx`

**Priority**: P1 (frontend routing)

**Description**: Add `/forgot-password` and `/reset-password/:token` routes to the app.

**Files to modify**:
- `packages/frontend/src/main.tsx` — add routes

**Tests to write first**:
- `packages/frontend/tests/unit/main.test.tsx` — verify routes are registered

**Acceptance criteria**:
- [ ] `/forgot-password` route renders `ForgotPassword`
- [ ] `/reset-password/:token` route renders `ResetPassword`
- [ ] Routes are public (no auth required)

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
- [ ] English translations are complete
- [ ] German translations are complete
- [ ] Both files remain consistent

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
- [ ] Feature is documented in English README
- [ ] Feature is documented in German README
- [ ] User guide includes step-by-step instructions
- [ ] German user guide matches English version
