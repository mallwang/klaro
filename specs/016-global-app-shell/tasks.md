# Tasks: Global App Shell with Top-Level Header and Footer

**Input**: Design documents from `specs/016-global-app-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new dependencies or project init needed — this is a pure frontend component refactor within the existing monorepo. Setup consists of creating the new file stubs.

- [ ] T001 Create empty stub files: `packages/frontend/src/components/AppShell/TopHeader.tsx` and `packages/frontend/src/components/AppShell/TopHeader.module.css`

---

## Phase 2: Foundational — Failing Tests (TDD: RED)

**Purpose**: Write and confirm all failing tests before any implementation. This phase MUST be complete before any component changes are made.

**Constitution mandate**: Per Principle I (Test-First), every new behavior must have a corresponding failing test committed before implementation code exists.

**⚠️ CRITICAL**: Run `pnpm test` after writing tests and confirm the new assertions FAIL. Do not proceed to Phase 3 until failures are confirmed.

- [ ] T002 Extend `packages/frontend/tests/unit/AppShell.test.tsx` — add assertion: header renders the text "Personal Contract Management"
- [ ] T003 Extend `packages/frontend/tests/unit/AppShell.test.tsx` — add assertion: header renders the language picker (query by visible language name, e.g. "English")
- [ ] T004 Extend `packages/frontend/tests/unit/AppShell.test.tsx` — add assertion: header renders the theme toggle button (aria-label matching light/dark mode label)
- [ ] T005 Extend `packages/frontend/tests/unit/AppShell.test.tsx` — add assertion: sidebar does NOT render the language picker
- [ ] T006 Extend `packages/frontend/tests/unit/AppShell.test.tsx` — add assertion: sidebar does NOT render the theme toggle button
- [ ] T007 Run `pnpm test` in `packages/frontend` and confirm T002–T006 assertions FAIL (required checkpoint before Phase 3)

**Checkpoint**: All new assertions are failing — implementation can now begin

---

## Phase 3: User Story 1 — Persistent Top-Level Header (Priority: P1) 🎯 MVP

**Goal**: A visible, always-present header bar on all authenticated pages showing the app icon placeholder, app name, language picker, and theme toggle.

**Independent Test**: Navigate to any authenticated route (`/`, `/contracts`, `/account`) and confirm the header renders with app icon/name on the left and language picker + theme toggle on the right.

### Implementation for User Story 1

- [ ] T008 [US1] Implement `packages/frontend/src/components/AppShell/TopHeader.tsx` — left section: `Burger` (hiddenFrom="sm") + `ThemeIcon` (tabler icon, e.g. `IconFileDescription`) + `Text` "Personal Contract Management"; right section: `LanguagePicker` component + theme toggle `ActionIcon` with `useMantineColorScheme`; props: `mobileOpened: boolean`, `toggleMobile: () => void`
- [ ] T009 [US1] Implement `packages/frontend/src/components/AppShell/TopHeader.module.css` — `.header { display: flex; align-items: center; justify-content: space-between; padding: 0 var(--mantine-spacing-md); height: 100%; }`, `.left { display: flex; align-items: center; gap: var(--mantine-spacing-sm); }`, `.right { display: flex; align-items: center; gap: var(--mantine-spacing-sm); }`
- [ ] T010 [US1] Update `packages/frontend/src/components/AppShell/AppShell.tsx` — add `header: { height: 60 }` prop to `MantineAppShell`; replace mobile-only `MantineAppShell.Header` with a full always-visible `MantineAppShell.Header` rendering `<TopHeader mobileOpened={mobileOpened} toggleMobile={toggleMobile} />`; pass `mobileOpened` state from `useDisclosure` into `TopHeader`
- [ ] T011 [US1] Update `packages/frontend/src/components/AppShell/AppShell.module.css` — remove or update the `.header` class that was used for the mobile burger header, adjust if any styles conflict with the new always-visible header

**Checkpoint**: User Story 1 is complete — header renders on all authenticated pages with app name, icon, language picker, and theme toggle. Run `pnpm test` and confirm T002, T003, T004 pass.

---

## Phase 4: User Story 2 — Persistent Global Footer (Priority: P2)

**Goal**: The existing `FooterSimple` is anchored to the bottom of every authenticated page using Mantine's dedicated footer slot.

**Independent Test**: On any authenticated page — with both short and tall content — confirm the footer appears at the bottom of the viewport and never overlaps content.

### Implementation for User Story 2

- [ ] T012 [US2] Update `packages/frontend/src/components/AppShell/AppShell.tsx` — add `footer: { height: 50 }` prop to `MantineAppShell`; remove `<FooterSimple />` from inside `MantineAppShell.Main`; add `<MantineAppShell.Footer><FooterSimple /></MantineAppShell.Footer>` below `MantineAppShell.Main`
- [ ] T013 [US2] Update `packages/frontend/src/components/AppShell/FooterSimple.module.css` — remove `margin-top: auto` from `.footer` (no longer needed; Mantine Footer slot handles placement); verify `border-top` and background styles still apply correctly

**Checkpoint**: User Story 2 is complete — footer anchored via Mantine slot, never overlaps content, existing `contentinfo` role assertion in tests still passes.

---

## Phase 5: User Story 3 — Language/Theme Controls Removed from Sidebar (Priority: P3)

**Goal**: The sidebar no longer contains the language picker or theme toggle. These controls exist only in the top-level header. All other sidebar functionality is preserved.

**Independent Test**: Inspect the sidebar — no language picker dropdown and no sun/moon theme toggle button. All nav links, user name, sign-out button, and admin segment control (for admin users) still render.

### Implementation for User Story 3

- [ ] T014 [US3] Update `packages/frontend/src/components/AppShell/NavbarSegmented.tsx` — remove the `settingsSection` div and its children (`LanguagePicker`, theme toggle `ActionIcon`, `Tooltip`); remove now-unused imports: `LanguagePicker`, `useMantineColorScheme`, `IconSun`, `IconMoon`, `Tooltip`
- [ ] T015 [US3] Update `packages/frontend/src/components/AppShell/NavbarSegmented.module.css` — remove the `.settingsSection` CSS block entirely

**Checkpoint**: User Story 3 is complete — sidebar clean, no duplicate controls. Run `pnpm test` and confirm T005, T006 pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, lint, and full validation pass.

- [ ] T016 [P] Run `pnpm tsc --noEmit` in `packages/frontend` — fix any TypeScript errors (expected: zero errors)
- [ ] T017 [P] Run `pnpm lint` in `packages/frontend` — fix any ESLint warnings or errors (expected: zero)
- [ ] T018 Run full test suite: `pnpm test` in `packages/frontend` — all tests including T002–T006 assertions must pass
- [ ] T019 Manual validation — follow all 8 scenarios in `specs/016-global-app-shell/quickstart.md`: header on each authenticated page, footer anchored, language/theme controls work from header, sidebar clean, unauthenticated pages unaffected, mobile layout accessible

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational/Tests)**: Depends on Phase 1 — BLOCKS all implementation phases
- **Phase 3 (US1 — Header)**: Depends on Phase 2 complete and tests confirmed failing
- **Phase 4 (US2 — Footer)**: Depends on Phase 2; can start in parallel with Phase 3 (different files: `AppShell.tsx` and `FooterSimple.module.css`)
- **Phase 5 (US3 — Sidebar cleanup)**: Depends on Phase 3 (header must exist before removing sidebar controls); can overlap with Phase 4
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5 all complete

### User Story Dependencies

- **US1 (P1)**: Foundational tests written → implement `TopHeader.tsx`, update `AppShell.tsx`
- **US2 (P2)**: Foundational tests written → update `AppShell.tsx` footer section (different section from US1 changes — can overlap)
- **US3 (P3)**: US1 header complete → remove sidebar controls (header must exist first)

### Within Each User Story

- Tests (Phase 2) MUST be written and confirmed FAILING before implementation
- CSS module before component (avoids import errors during test runs)
- Component implementation before AppShell wiring

### Parallel Opportunities

- T001 (stub creation): immediate
- T002–T006 (test assertions): all can be written in parallel (same file, but no ordering dependency between individual assertions)
- T008 + T009 (TopHeader TSX + CSS): parallel — different files
- T012 + T013 (Footer slot + CSS): parallel with T008/T009 — different files
- T016 + T017 (tsc + lint): parallel — independent tools

---

## Parallel Example: Phase 2 (Foundational Tests)

```
Write together in one editing pass:
- T002: app name assertion in AppShell.test.tsx
- T003: language picker in header assertion
- T004: theme toggle in header assertion
- T005: language picker absent from sidebar assertion
- T006: theme toggle absent from sidebar assertion
Then T007: run pnpm test to confirm all fail
```

## Parallel Example: Phase 3 + 4 (Header + Footer, can overlap)

```
Parallelizable across different files:
- T008 + T009: TopHeader.tsx + TopHeader.module.css
- T012 + T013: AppShell footer slot + FooterSimple.module.css
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Create file stubs
2. Phase 2: Write failing tests, confirm failures
3. Phase 3: Implement `TopHeader` and wire into `AppShell`
4. **STOP and VALIDATE**: `pnpm test` passes for header assertions, manual check on `/` and `/contracts`
5. Ship or demo

### Incremental Delivery

1. Phase 1 + 2 → Failing tests committed
2. Phase 3 → Header visible on all pages (MVP)
3. Phase 4 → Footer properly anchored
4. Phase 5 → Sidebar decluttered
5. Phase 6 → Full quality gate

---

## Notes

- [P] tasks touch different files and have no incomplete dependencies — safe to run concurrently
- TDD is mandatory (Constitution Principle I) — do not skip Phase 2 or reorder tests after implementation
- No new npm dependencies — all icons and components are from existing packages
- The `mobileOpened` + `toggleMobile` props on `TopHeader` keep the burger in the header on small screens — do not remove this mobile wiring
- `MantineAppShell` automatically adjusts `Main` padding for the header and footer heights declared in props — no manual CSS offset needed
