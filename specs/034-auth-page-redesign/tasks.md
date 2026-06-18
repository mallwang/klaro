# Tasks: Authentication Page Redesign

**Input**: Design documents from `specs/034-auth-page-redesign/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included — TDD is NON-NEGOTIABLE per project constitution (Principle I). Tests must be written first and must fail before implementation begins.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web app — all frontend changes under `packages/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add assets and i18n keys required by the new `AuthImageLayout` component before component work begins.

- [ ] T001 Add placeholder image asset for the auth panel to `packages/frontend/src/assets/auth-panel.jpg` (or `.svg` gradient) — any free-to-use image or CSS-only gradient placeholder; exact asset decided at coding time
- [ ] T002 [P] Add `authPage` i18n keys (`authPage.imageAlt`, `authPage.tagline`) to `packages/frontend/src/i18n/locales/en.json`
- [ ] T003 [P] Add `authPage` i18n keys (`authPage.imageAlt`, `authPage.tagline`) to `packages/frontend/src/i18n/locales/de.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build and verify the shared `AuthImageLayout` component that both US1 and US2 depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

> **TDD**: Write T004 first, confirm it FAILS, then implement T005.

- [ ] T004 Write failing Vitest component test for `AuthImageLayout` in `packages/frontend/src/components/__tests__/AuthImageLayout.test.tsx` — cover: two-column grid renders on desktop, image column hidden on xs viewport, children appear in form column, custom `imageUrl` prop is applied, missing `imageUrl` renders default asset
- [ ] T005 Implement `AuthImageLayout` component in `packages/frontend/src/components/AuthImageLayout.tsx` using Mantine `Grid` + `Grid.Col` with `visibleFrom="sm"` for image column and `BackgroundImage` for the panel; wraps `PublicLayout`; accepts `children: ReactNode` and optional `imageUrl?: string`

**Checkpoint**: `AuthImageLayout` unit tests pass — foundational layout component ready for both US1 and US2.

---

## Phase 3: User Story 1 — Sign In with New Layout (Priority: P1) 🎯 MVP

**Goal**: Replace the existing `SignIn` page with `AuthPage` using `AuthImageLayout`; sign-in form renders in the two-column layout with email + password fields only.

**Independent Test**: Navigate to `/sign-in`, verify two-column layout, submit valid credentials, confirm authenticated redirect. Run `pnpm --filter frontend test:e2e` — existing sign-in Playwright tests must pass.

> **TDD**: Write T006 first, confirm it FAILS, then implement T007 onward.

- [ ] T006 Write failing Vitest component test for the sign-in view of `AuthPage` in `packages/frontend/src/pages/__tests__/AuthPage.test.tsx` — cover: sign-in form renders with email and password fields, no "remember me" checkbox, no "create account" link, "Forgot password?" link is present, form submission calls `useSignIn`, error alerts render on auth failure (401, 423)
- [ ] T007 Create `AuthPage` component with sign-in view in `packages/frontend/src/pages/AuthPage.tsx` — accepts `initialView: 'sign-in' | 'forgot-password'` prop; renders sign-in form inside `AuthImageLayout`; preserves all session-check logic, redirect-after-login logic, and error handling from the deleted `SignIn.tsx`; "Forgot password?" link calls `setView('forgot-password')` (no `navigate()`)
- [ ] T008 Update `/sign-in` route in `packages/frontend/src/main.tsx` to render `<AuthPage initialView="sign-in" />` instead of `<SignIn />`; remove `SignIn` import
- [ ] T009 Delete `packages/frontend/src/pages/SignIn.tsx` (logic fully merged into `AuthPage`)

**Checkpoint**: Navigate to `/sign-in` in the browser — two-column layout renders, sign-in form works end-to-end, Vitest tests pass.

---

## Phase 4: User Story 2 — Forgot Password with New Layout (Priority: P2)

**Goal**: Extend `AuthPage` with a forgot-password form view and implement view toggle; `/forgot-password` route renders `AuthPage` with the forgot-password form initially visible; no full page reload when toggling between forms.

**Independent Test**: Navigate to `/forgot-password` directly — forgot-password form renders in two-column layout. Click "Back to sign in" — sign-in form appears without page reload or image panel flicker. Submit forgot-password form with a valid email — success message appears.

> **TDD**: Write T010 first, confirm it FAILS, then implement T011 onward.

- [ ] T010 Add failing Vitest component tests for the forgot-password view and toggle to `packages/frontend/src/pages/__tests__/AuthPage.test.tsx` — cover: `initialView="forgot-password"` shows forgot-password form, forgot-password form contains only email field and submit button, "Back to sign in" link switches view back to sign-in without `navigate()` call, success alert renders after successful submission, inline validation error renders on HTTP 400, clicking "Forgot password?" on sign-in view switches to forgot-password view
- [ ] T011 [US2] Add forgot-password form view and state toggle to `packages/frontend/src/pages/AuthPage.tsx` — add `view` state (`useState(initialView)`); add forgot-password form branch; add `forgotEmail`, `forgotSuccess`, `forgotValidationError`, `forgotGenericError`, `forgotIsPending` state; wire `useRequestPasswordReset` hook; "Forgot password?" → `setView('forgot-password')`, "Back to sign in" → `setView('sign-in')`; preserve all error handling from deleted `ForgotPassword.tsx`
- [ ] T012 [US2] Update `/forgot-password` route in `packages/frontend/src/main.tsx` to render `<AuthPage initialView="forgot-password" />` instead of `<ForgotPassword />`; remove `ForgotPassword` import
- [ ] T013 [US2] Delete `packages/frontend/src/pages/ForgotPassword.tsx` (logic fully merged into `AuthPage`)

**Checkpoint**: Both `/sign-in` and `/forgot-password` routes render using `AuthImageLayout`. Toggle between forms works without page remount. All Vitest tests pass.

---

## Phase 5: User Story 3 — Consistent Layout for Future Public Pages (Priority: P3)

**Goal**: Verify and confirm that `AuthImageLayout` is a generic, reusable component with no sign-in or forgot-password specific logic; usable by any future public page without modification.

**Independent Test**: Inspect `AuthImageLayout.tsx` — no form-specific logic, no imports from `AuthPage`, no conditional branches for specific page types. Add a trivial consumer test in `AuthImageLayout.test.tsx`.

- [ ] T014 [US3] Add a Vitest test to `packages/frontend/src/components/__tests__/AuthImageLayout.test.tsx` confirming `AuthImageLayout` renders arbitrary children correctly (pass a `<div data-testid="custom-child" />` and assert it appears in the DOM) — verifies the component is a generic slot and not coupled to sign-in/forgot-password content
- [ ] T015 [US3] Review `packages/frontend/src/components/AuthImageLayout.tsx` and remove any sign-in or forgot-password specific logic if present; ensure props are `children: ReactNode` and optional `imageUrl?: string` only; add JSDoc comment per project convention

**Checkpoint**: `AuthImageLayout` is confirmed generic. Any future public page can import and use it by passing its own content as `children`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates, e2e verification, and quickstart validation.

- [ ] T016 Run Playwright e2e suite and confirm all existing auth tests pass: `pnpm --filter frontend test:e2e` — fix any test selector mismatches caused by the new layout markup; do NOT change test assertions or coverage
- [ ] T017 [P] Update `README.md` (English) and `README.de.md` (German) to describe the new two-column authentication page design
- [ ] T018 [P] Update `docs/user-guide.md` (English) and `docs/user-guide.de.md` (German) to document the new sign-in and forgot-password page appearance and the form-toggle behaviour
- [ ] T019 Run all nine quickstart.md manual validation scenarios from `specs/034-auth-page-redesign/quickstart.md` and confirm each passes
- [ ] T020 Run full Vitest suite: `pnpm --filter frontend test` — confirm zero regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately; T002 and T003 run in parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user stories**; T004 before T005 (TDD)
- **Phase 3 (US1)**: Depends on Phase 2; T006 before T007 (TDD); T007 before T008 before T009
- **Phase 4 (US2)**: Depends on Phase 3; T010 before T011 (TDD); T011 before T012 before T013
- **Phase 5 (US3)**: Depends on Phase 4; T014 before T015
- **Phase 6 (Polish)**: Depends on all user story phases complete; T017 and T018 run in parallel

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational — no other user story dependency
- **US2 (P2)**: Depends on US1 completion (extends `AuthPage`)
- **US3 (P3)**: Depends on US2 completion (verifies the component is generic)

### Within Each User Story

- Tests MUST be written and confirmed failing before implementation begins
- Routing change only after the page component is complete and tested
- Old page files deleted only after new routing is confirmed working

---

## Parallel Example: Phase 1

```bash
# T002 and T003 can run simultaneously (different files):
Task: "Add authPage i18n keys to packages/frontend/src/i18n/locales/en.json"
Task: "Add authPage i18n keys to packages/frontend/src/i18n/locales/de.json"
```

## Parallel Example: Phase 6

```bash
# T017 and T018 can run simultaneously:
Task: "Update README.md and README.de.md"
Task: "Update docs/user-guide.md and docs/user-guide.de.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (assets + i18n keys)
2. Complete Phase 2: Foundational (`AuthImageLayout` component with tests)
3. Complete Phase 3: US1 (`AuthPage` sign-in view, route update, delete `SignIn.tsx`)
4. **STOP and VALIDATE**: Test `/sign-in` end-to-end, run Playwright suite
5. Ship if ready — forgot-password still works via the old `ForgotPassword.tsx` route temporarily

### Incremental Delivery

1. Phase 1 + 2 → `AuthImageLayout` ready
2. Phase 3 → Sign-in redesigned ✅ (MVP deliverable)
3. Phase 4 → Forgot-password redesigned ✅
4. Phase 5 → Architecture verified as reusable ✅
5. Phase 6 → Docs + final validation ✅

---

## Notes

- [P] tasks = different files, no incomplete-task dependencies — safe to run concurrently
- [Story] label maps each task to a specific user story for traceability
- TDD is mandatory per constitution Principle I — never implement before the test exists and fails
- `AuthCard.tsx` is NOT modified — it continues serving `ResetPassword`, `AcceptInvitation`, and `EmailVerifyConfirm`
- Do not add "remember me" or "create account" to any form — their absence is intentional (spec FR-002)
- Both `en.json` and `de.json` must stay in sync at all times (project documentation standards)
- Commit after each task or logical group per constitution development workflow
