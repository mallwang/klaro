# Tasks: Account Settings Page Restructure

**Input**: Design documents from `specs/025-settings-page-restructure/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ quickstart.md ✅

**Organization**: Tasks grouped by user story; US1 and US2 are both P1 and share the same
JSX change, so their implementation is handled in a single phase. US3 (regression safety) is
validated by the test suite — no new implementation required.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All paths are relative to the repository root

---

## Phase 1: Foundational — Failing Tests First (TDD Gate)

**Purpose**: Write the new unit test BEFORE any JSX is changed. The test must fail at this
point; that failure proves the headings do not yet exist and gives us a clear red state.

**⚠️ CRITICAL**: Constitution Principle I requires this test to exist and FAIL before Phase 2
begins.

- [ ] T001 Add a `describe('AccountSettings – Section headings')` block to `packages/frontend/tests/unit/AccountSettings.test.tsx` with two `it` assertions: one that `screen.getByRole('heading', { name: /email settings/i })` is in the document, and one that `screen.getByRole('heading', { name: /^account$/i })` is in the document — run `pnpm --filter frontend test run` and confirm the two new assertions FAIL

**Checkpoint**: Two new test assertions are failing. All previously passing tests still pass.

---

## Phase 2: User Stories 1 & 2 — Email Settings and Account Section Headings (Priority: P1) 🎯 MVP

**Goal (US1)**: A clearly labelled "Email Settings" section containing the summary-email and
email-language controls is visible on the Account Settings page.

**Goal (US2)**: A clearly labelled "Account" section containing the display-name, email-address,
password, and danger-zone controls is visible below the Email Settings section.

**Independent Test**: Run `pnpm --filter frontend test run` — the two new heading assertions
added in T001 must now pass, and all pre-existing tests must continue to pass.

### i18n Keys

- [ ] T002 [P] [US1] Add key `accountSettings.emailSettingsSectionTitle` → `"Email Settings"` and `accountSettings.accountSectionTitle` → `"Account"` to `packages/frontend/src/i18n/locales/en.json` (inside the existing `accountSettings` object)
- [ ] T003 [P] [US1] Add key `accountSettings.emailSettingsSectionTitle` → `"E-Mail-Einstellungen"` and `accountSettings.accountSectionTitle` → `"Konto"` to `packages/frontend/src/i18n/locales/de.json` (inside the existing `accountSettings` object)

### JSX Restructure

- [ ] T004 [US1] [US2] Restructure `packages/frontend/src/pages/AccountSettings.tsx`: replace the flat outer `<Stack gap="lg">` children with two sub-sections separated by a `<Divider my="md" />` — first sub-section renders a `<Title order={3}>{t('accountSettings.emailSettingsSectionTitle')}</Title>` followed by the Summary Email `<Paper>` and Email Language `<Paper>`; second sub-section renders a `<Title order={3}>{t('accountSettings.accountSectionTitle')}</Title>` followed by the Display Name `<Paper>`, Email Address `<Paper>`, Change Password `<Paper>`, and Danger Zone `<Paper>` — no handlers, state, or logic may be changed

**Checkpoint**: Run `pnpm --filter frontend test run` — all tests (including the two new ones)
pass. Both section headings are visible in the browser at `/account-settings`.

---

## Phase 3: User Story 3 — Regression Validation (Priority: P2)

**Goal (US3)**: Confirm that every interaction that existed before the restructure still works
identically: save handlers, toast notifications, validation, sole-admin guard, pending email
notice, delete confirmation modal.

**Independent Test**: Full unit test suite passes; quickstart.md Scenarios 3–5 pass manually.

- [ ] T005 [US3] Run `pnpm --filter frontend test run` and confirm 100 % of pre-existing tests pass without modification — document the before/after pass counts in a comment in this file
- [ ] T006 [US3] Run `pnpm --filter frontend tsc --noEmit` and confirm zero TypeScript errors (the two new i18n keys under `accountSettings` are picked up automatically via `typeof en` in `packages/frontend/src/i18n/types.d.ts`)
- [ ] T007 [P] [US3] Manually validate quickstart.md Scenario 3 (all controls function correctly) and Scenario 4 (German translations display) in the running dev server

**Checkpoint**: No regressions. Both sections render correctly in English and German.

---

## Phase 4: Polish & Documentation

**Purpose**: Documentation updates required by CLAUDE.md and project constitution after every
feature implementation.

- [ ] T008 [P] Update `README.md` to reflect the restructured Account Settings layout (mention the two sections: Email Settings and Account)
- [ ] T009 [P] Update `README.de.md` with the same restructure description in German
- [ ] T010 [P] Update `docs/user-guide.md` to document the new section structure under Account Settings — where to find email preferences vs. account management controls
- [ ] T011 [P] Update `docs/user-guide.de.md` with the same user-guide content in German

**Checkpoint**: README and user-guide files are consistent across both languages.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (TDD Gate)**: No dependencies — start immediately
- **Phase 2 (Implementation)**: Depends on Phase 1 (failing test must exist first)
  - T002 and T003 can run in parallel (different files)
  - T004 depends on T002 and T003 (needs i18n keys before using `t()`)
- **Phase 3 (Regression)**: Depends on Phase 2 completion
- **Phase 4 (Polish)**: Depends on Phase 2 completion; can overlap with Phase 3

### User Story Dependencies

- **US1 + US2 (P1)**: Both implemented by T002–T004 in a single phase — they share the same JSX edit
- **US3 (P2)**: Validation only; depends on US1 + US2 being complete

### Within Phase 2

- T002 and T003 are independent (en.json vs de.json) — mark [P], run together
- T004 depends on T002 and T003 — run after both complete

### Parallel Opportunities

```bash
# Run T002 and T003 together (different files):
Task: "Add emailSettingsSectionTitle + accountSectionTitle to en.json"
Task: "Add emailSettingsSectionTitle + accountSectionTitle to de.json"

# Run T008–T011 together (all independent documentation files):
Task: "Update README.md"
Task: "Update README.de.md"
Task: "Update docs/user-guide.md"
Task: "Update docs/user-guide.de.md"
```

---

## Implementation Strategy

### MVP (Minimum Viable Change)

1. Complete Phase 1: Write the failing test (T001)
2. Complete Phase 2: Add i18n keys (T002, T003) then restructure JSX (T004)
3. **STOP and VALIDATE**: run tests, open browser, confirm both headings appear
4. Complete Phase 3: Regression checks (T005–T007)
5. Complete Phase 4: Documentation (T008–T011)

### Scope Boundary

- No new components, hooks, services, or backend changes
- No changes to any handler, state variable, or mutation
- Only files touched: `AccountSettings.tsx`, `en.json`, `de.json`,
  `AccountSettings.test.tsx`, `README.md`, `README.de.md`,
  `docs/user-guide.md`, `docs/user-guide.de.md`

---

## Notes

- [P] tasks operate on different files and have no shared dependencies
- `types.d.ts` does NOT need manual edits — it derives types from `typeof en` automatically
- The `<Divider>` import from `@mantine/core` may need to be added to the import list in `AccountSettings.tsx`
- The section headings use `order={3}` to sit below the existing page `<Title order={2}>` — adjust if visual hierarchy differs
- Commit after T001 (red state), after T004 (green state), and after T011 (docs complete)
