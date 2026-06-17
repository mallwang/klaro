---

description: "Task list for feature 033-mobile-responsive"
---

# Tasks: Mobile-Responsive Web App

**Input**: Design documents from `specs/033-mobile-responsive/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Included. Constitution Principle I (Test-First, NON-NEGOTIABLE) requires a failing Vitest assertion before every column-hiding/behavior change, plus new Playwright mobile-viewport coverage and regression-lock assertions for components already found compliant during the research audit.

**Organization**: Tasks are grouped by the 4 user stories from [spec.md](spec.md) (US1–US4), each independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on an incomplete task)
- **[Story]**: Maps the task to US1–US4
- All file paths are relative to the repository root unless otherwise noted

---

## Phase 1: Setup

**Purpose**: Confirm a clean, green baseline before any mobile-responsive change.

- [ ] T001 Run `pnpm install` at the repo root, then `pnpm --filter @pcm/frontend test`, `pnpm --filter @pcm/frontend exec tsc --noEmit`, `pnpm --filter @pcm/frontend lint`, and `pnpm --filter @pcm/frontend test:e2e` to confirm the pre-change baseline is green, per [quickstart.md](quickstart.md#prerequisites)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure every user story's new mobile E2E coverage depends on.

**⚠️ CRITICAL**: T002 must be complete before any `mobile-*.spec.ts` task below can run.

- [ ] T002 Add a `mobile-chromium` Playwright project to `packages/frontend/playwright.config.ts` using `devices['iPhone 13']` from `@playwright/test`, scoped to `tests/e2e/mobile-*.spec.ts`, per [research.md](research.md#decision-8-e2e-testing-approach-for-mobile-viewports)

**Checkpoint**: Foundation ready — user story work can begin.

---

## Phase 3: User Story 1 - Navigate the app on a phone (Priority: P1) 🎯 MVP

**Goal**: Header, navbar, and footer render without overlap or horizontal scroll at phone widths; every navigation item is reachable through the burger menu.

**Independent Test**: Load the app at a phone-sized viewport, open the navigation menu, move between all main sections, confirm no sideways page scroll and every menu item is tappable.

### Tests for User Story 1

- [ ] T003 [P] [US1] Create `packages/frontend/tests/e2e/mobile-navigation.spec.ts` (under the `mobile-chromium` project): assert no horizontal page scroll (`scrollWidth <= clientWidth`) on the Dashboard, Contracts, Account Settings, and FAQ pages; assert the burger menu opens, every `NavbarSegmented` link is visible and tappable, and each link navigates to its expected route (depends on T002)

### Implementation for User Story 1

- [ ] T004 [US1] Audit `packages/frontend/src/components/AppShell/AppShell.tsx`, `TopHeader.tsx`, `NavbarSegmented.tsx`, `FooterSimple.tsx` (and their `.module.css` siblings) against FR-001/FR-002 at 320–480px; fix any overlap, clipping, or touch-target gap found directly in these files
- [ ] T005 [US1] Extend `packages/frontend/tests/unit/AppShell.test.tsx` with a regression-lock assertion that every nav item is present in the DOM once the mobile burger menu is toggled open (depends on T004)

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Review and manage contracts on a phone (Priority: P1)

**Goal**: Contracts table shows only Name/Amount/End date/Actions at phone widths (Category/Status hidden, still reachable via the row); the contract form is fully usable single-column; the import column-mapping table doesn't overflow.

**Independent Test**: On a phone-sized viewport, open the contracts list, confirm key details are visible, open a contract, edit it, and save without layout issues.

### Tests for User Story 2

- [ ] T006 [P] [US2] Add failing Vitest assertions in `packages/frontend/tests/unit/ContractTable.test.tsx`: Category and Status `Table.Th`/`Table.Td` are not visible at a mocked phone-sized viewport while Name, Amount, End date, and Actions remain visible
- [ ] T007 [P] [US2] Create `packages/frontend/tests/e2e/mobile-contracts.spec.ts` (under `mobile-chromium`): confirm Name/Amount/End date are visible without zoom and no horizontal page scroll on the contracts list; open a contract, confirm the form stacks in one column, edit a field, and save successfully (depends on T002)

### Implementation for User Story 2

- [ ] T008 [US2] In `packages/frontend/src/components/ContractTable.tsx`, add `visibleFrom="sm"` / `hiddenFrom="sm"` to the Category and Status header/data cells so they hide below the `sm` breakpoint, per [research.md Decision 2](research.md#decision-2-data-dense-table-strategy-resolves-spec-fr-004) (depends on T006 failing first)
- [ ] T009 [US2] Verify the row-action buttons in `packages/frontend/src/components/ContractTable.tsx` meet the 44×44px touch target at phone breakpoints; if not, add scoped mobile-only padding in `packages/frontend/src/components/ContractTable.module.css` without changing the existing compact desktop sizing from feature 029 (depends on T008)
- [ ] T010 [P] [US2] Audit `packages/frontend/src/components/ContractForm.tsx` / `ContractForm.module.css` against FR-005 at 320–480px; confirm the existing `@media (max-width: 48em)` rule fully collapses `nameRow`/`twoColumnRow`/`statusDateRow`/`cancellationAnonymizeRow`; fix any residual gap found
- [ ] T011 [P] [US2] Audit `packages/frontend/src/components/ColumnMappingTable.tsx` (used by `packages/frontend/src/pages/ContractImport.tsx`) for overflow at phone widths; wrap it in `Table.ScrollContainer` if overflow is found, per [data-model.md](data-model.md#affected-components)
- [ ] T012 [US2] Extend `packages/frontend/tests/unit/ContractForm.test.tsx` with a regression-lock assertion that the form renders single-column at a mocked phone-sized viewport (depends on T010)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - View the dashboard summary on a phone (Priority: P2)

**Goal**: Spending overview, upcoming renewals, and expired contracts widgets stack vertically and stay fully readable at phone widths.

**Independent Test**: On a phone-sized viewport, open the dashboard and confirm each widget is fully visible, readable, and stacked vertically.

### Tests for User Story 3

- [ ] T013 [P] [US3] Create `packages/frontend/tests/e2e/mobile-dashboard.spec.ts` (under `mobile-chromium`): load the Dashboard at a phone viewport, confirm `SpendingOverview`, `UpcomingRenewals`, and `ExpiredContracts` are stacked vertically (sequential, non-overlapping bounding boxes) and there is no horizontal page scroll (depends on T002)

### Implementation for User Story 3

- [ ] T014 [P] [US3] Audit `packages/frontend/src/pages/Dashboard.tsx`, `src/components/SpendingOverview.tsx`, `UpcomingRenewals.tsx`, `ExpiredContracts.tsx` against FR-006 at 320px (check stat-card `borderBottomColor` styling and progress-bar labels for clipping); fix any gap found
- [ ] T015 [US3] Extend `packages/frontend/tests/unit/SpendingOverview.test.tsx` with a regression-lock assertion that the stat grid renders a single column at the `base` breakpoint (depends on T014)

**Checkpoint**: User Stories 1–3 are all independently functional.

---

## Phase 6: User Story 4 - Manage account and admin settings on a phone (Priority: P3)

**Goal**: Account settings forms stay usable; admin members/invitations tables hide lower-priority columns; the diagnostics `SimpleGrid` collapses to one column; `DeleteAccountModal` goes full-screen on phone widths.

**Independent Test**: On a phone-sized viewport, open account settings and the admin accounts page and confirm forms, lists, and action buttons remain usable.

### Tests for User Story 4

- [ ] T016 [P] [US4] Add failing Vitest assertions in `packages/frontend/tests/unit/AccountsAdmin.test.tsx`: members table hides Email/Role below `sm` (Name/Status/Actions remain visible); invitations table hides "Sent at"/Date below `sm` (Email/Invitation status/Actions remain visible)
- [ ] T017 [P] [US4] Add a failing Vitest assertion in `packages/frontend/tests/unit/DeleteAccountModal.test.tsx` that the Mantine `Modal` receives `fullScreen` when `useMediaQuery` reports a phone-sized viewport
- [ ] T018 [P] [US4] Create `packages/frontend/tests/e2e/mobile-admin.spec.ts` (under `mobile-chromium`): as an admin, open the accounts page at a phone viewport, confirm the members/invitations tables show only their priority columns with no horizontal page scroll, and the diagnostics section (test email / logo cache) stacks in one column (depends on T002)

### Implementation for User Story 4

- [ ] T019 [US4] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx`, add `visibleFrom="sm"` / `hiddenFrom="sm"` to the Email/Role cells (members table) and the "Sent at"/Date cells (invitations table), per [research.md Decision 2](research.md#decision-2-data-dense-table-strategy-resolves-spec-fr-004) (depends on T016 failing first)
- [ ] T020 [US4] In `packages/frontend/src/pages/admin/AccountsAdmin.tsx` (diagnostics section, ~line 648), change `SimpleGrid cols={2}` to `SimpleGrid cols={{ base: 1, sm: 2 }}`, per the confirmed gap in [data-model.md](data-model.md#affected-components) (depends on T019)
- [ ] T021 [P] [US4] In `packages/frontend/src/components/DeleteAccountModal.tsx`, use `useMediaQuery` from `@mantine/hooks` to pass `fullScreen` to the Mantine `Modal` on phone-sized viewports, per [research.md Decision 6](research.md#decision-6-modals-on-mobile) (depends on T017 failing first)
- [ ] T022 [P] [US4] Audit `packages/frontend/src/pages/AccountSettings.tsx` against FR-005 at 320–480px (already uses `SimpleGrid cols={{ base: 1, sm: 2 }}`); fix any residual gap found
- [ ] T023 [US4] Extend `packages/frontend/tests/unit/AccountSettings.test.tsx` with a regression-lock assertion that its sections render single-column at a mocked phone-sized viewport (depends on T022)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cover the remaining in-scope pages that don't map to a single user story, then validate and document the whole feature.

- [ ] T024 [P] Audit `packages/frontend/src/pages/Faq.tsx` against FR-001/FR-008 at 320–480px (already built with a responsive `SimpleGrid` per feature 032); extend `packages/frontend/tests/unit/Faq.test.tsx` with a regression-lock viewport assertion; fix any gap found
- [ ] T025 [P] Audit `packages/frontend/src/pages/SignIn.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `AcceptInvitation.tsx`, and `packages/frontend/src/components/AuthCard.tsx` against FR-001/FR-005/FR-008 at 320px; fix any non-collapsing layout using the existing CSS-module media-query pattern ([research.md Decision 4](research.md#decision-4-forms)); extend `tests/unit/SignIn.test.tsx`, `tests/unit/pages/ForgotPassword.test.tsx`, and `tests/unit/pages/ResetPassword.test.tsx` with regression-lock viewport assertions
- [ ] T026 Spot-check the 44×44px touch target requirement (FR-003/SC-004) across the navbar burger, pagination controls, and table row actions per [quickstart.md](quickstart.md#manual-validation) step 5; apply scoped, mobile-only CSS padding fixes wherever still short of 44px after T009/T019
- [ ] T027 Run the full automated suite per [quickstart.md](quickstart.md#automated-validation): `pnpm --filter @pcm/frontend test`, `pnpm --filter @pcm/frontend exec tsc --noEmit`, `pnpm --filter @pcm/frontend lint`, `pnpm --filter @pcm/frontend test:e2e` (all projects, including `mobile-chromium`); fix any regression found
- [ ] T028 Perform the manual validation walkthrough in [quickstart.md](quickstart.md#manual-validation) (steps 1–6: phone-width emulation per user story, landscape rotation check, touch-target spot-check, desktop-width regression re-check)
- [ ] T029 [P] Update `README.md` / `README.de.md` and `docs/user-guide.md` / `docs/user-guide.de.md` to document the mobile-responsive behavior (collapsible nav, reduced table columns with full details via the row, full-screen modals on phone), per CLAUDE.md's documentation requirements
- [ ] T030 Verify JSDoc coverage on every new/modified function (e.g. the `useMediaQuery`-based `fullScreen` logic in `DeleteAccountModal.tsx`), per CLAUDE.md's JSDoc requirement
- [ ] T031 Run the SonarCloud analysis workflow (`mcp__sonarqube__analyze_code_snippet` / `search_sonar_issues_in_projects`, project key `mallwang_personal-contract-management`) on all files touched in this feature; resolve any new bug, critical code smell, or duplication finding before considering the feature done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: No dependencies, but T002 BLOCKS every `mobile-*.spec.ts` task in Phases 3–6
- **User Stories (Phases 3–6)**: All depend on Phase 2 completion; otherwise independent of each other and may proceed in parallel or in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories
- **US2 (P1)**: No dependency on other stories
- **US3 (P2)**: No dependency on other stories
- **US4 (P3)**: No dependency on other stories

### Within Each User Story

- Tests are written first and confirmed to fail before the corresponding implementation task (Constitution Principle I)
- Regression-lock tests for already-compliant components follow their audit task, so the assertion reflects the final reviewed state

### Parallel Opportunities

- T001 has no parallel siblings (single baseline check)
- T002 has no parallel siblings (single config task) but unblocks T003, T007, T013, T018
- Once T002 completes, US1–US4 implementation work can proceed in parallel by different contributors
- Within a story, [P]-marked tasks touch disjoint files and can run concurrently; non-[P] tasks share a file or depend on a prior task's outcome in that story

---

## Parallel Example: User Story 2

```bash
# After T002 (Foundational) is done, these can run together:
Task: "Add failing Vitest assertions in packages/frontend/tests/unit/ContractTable.test.tsx for Category/Status column hiding"
Task: "Create packages/frontend/tests/e2e/mobile-contracts.spec.ts under mobile-chromium"
Task: "Audit packages/frontend/src/components/ContractForm.tsx / ContractForm.module.css against FR-005"
Task: "Audit packages/frontend/src/components/ColumnMappingTable.tsx for overflow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (adds the `mobile-chromium` Playwright project)
3. Complete Phase 3: User Story 1 (navigation)
4. **STOP and VALIDATE**: run `mobile-navigation.spec.ts` and the extended `AppShell.test.tsx` independently

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (navigation) → validate → demo (MVP)
3. US2 (contracts list & form) → validate → demo
4. US3 (dashboard) → validate → demo
5. US4 (account & admin settings) → validate → demo
6. Phase 7 Polish → full regression, docs, JSDoc, SonarCloud

### Parallel Team Strategy

With multiple contributors, once Phase 2 is complete:

- Contributor A: US1 (Phase 3)
- Contributor B: US2 (Phase 4)
- Contributor C: US3 (Phase 5)
- Contributor D: US4 (Phase 6)

Each story integrates independently; Phase 7 runs only after all four are merged.

---

## Notes

- [P] tasks touch different files and have no unmet dependency
- [Story] labels map every Phase 3–6 task to US1–US4 for traceability
- Column-hiding and `fullScreen`/`SimpleGrid` changes follow strict red→green: write the failing test, then implement
- Audit-only components (already compliant) still get a regression-lock assertion so future changes can't silently break them
- No new npm packages, no new breakpoints, no new responsive mechanism — only `visibleFrom`/`hiddenFrom`, responsive `SimpleGrid cols`, the existing CSS-module media-query pattern, and `useMediaQuery`
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
