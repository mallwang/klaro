---
description: "Task list for FAQ Section (032)"
---

# Tasks: FAQ Section

**Input**: Design documents from `specs/032-faq-section/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included — Test-First is NON-NEGOTIABLE per project constitution (Principle I).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Path Conventions

All paths are relative to repository root. This feature touches only `packages/frontend/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Acquire the decorative image asset that both user stories depend on for the FAQ page layout.

- [ ] T001 Download the FAQ illustration SVG from the Mantine UI example (https://ui.mantine.dev/category/faq/#faq-with-image — source the image used by that example) and save it as `packages/frontend/src/assets/faq-image.svg`

**Checkpoint**: Image asset in place. All subsequent tasks can reference it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add FAQ content to both translation files and add the `nav.faq` i18n key. These changes are required before any component can render meaningful content or navigate to the FAQ page.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Add `nav.faq` translation key to `packages/frontend/src/i18n/locales/en.json` (value: `"FAQ"`) in the existing `nav` section
- [ ] T003 [P] Add `faq` section with `title` and `items` array (8–10 lorem ipsum Q&A entries) to `packages/frontend/src/i18n/locales/en.json` — see data-model.md for the expected JSON schema
- [ ] T004 [P] Add `nav.faq` key (value: `"FAQ"`) and matching `faq` section (German translations for all entries from T003) to `packages/frontend/src/i18n/locales/de.json` — entry count must match en.json exactly

**Note**: T003 and T004 touch different files and can proceed in parallel after T002 is committed.

**Checkpoint**: Both JSON files have the `faq` section. Language switching will serve the correct content.

---

## Phase 3: User Story 1 — Browse FAQ (Priority: P1) 🎯 MVP

**Goal**: A signed-in user can navigate to `/faq` from the sidebar and read Q&A entries using an accordion.

**Independent Test**: Run `pnpm --filter frontend test Faq` (unit) and navigate to `http://localhost:5173/faq` after `pnpm dev` (manual).

### Tests for User Story 1 ⚠️ Write FIRST — verify they FAIL before implementation

- [ ] T005 [US1] Write failing Vitest component test in `packages/frontend/tests/unit/Faq.test.tsx`:
  - Mock `react-i18next` `useTranslation` to return a fixture with `faq.items` (3 entries) and `faq.title`
  - Assert the page renders the heading text
  - Assert the correct number of `Accordion.Item` elements are present (one per entry)
  - Assert each item's control button contains the question text
  - Assert the page renders without crashing when `faq.items` returns a non-array (graceful fallback)
- [ ] T006 [P] [US1] Write failing Playwright E2E test in `packages/frontend/tests/e2e/faq.spec.ts`:
  - Sign in, click the FAQ nav link, assert `/faq` route is active
  - Assert the page heading is visible
  - Click the first accordion item, assert its answer panel expands (becomes visible)

### Implementation for User Story 1

- [ ] T007 [US1] Create `packages/frontend/src/pages/Faq.tsx` implementing the Mantine "faq-with-image" layout:
  - Use `SimpleGrid` with `cols={{ base: 1, sm: 2 }}` (image column + accordion column)
  - Render the decorative image from `../assets/faq-image.svg` using Mantine `Image`
  - Use `useTranslation()` to read `faq.title` (section heading) and `faq.items` with `returnObjects: true`
  - Cast the result to `FaqEntry[]` (type defined in the same file) and guard with `Array.isArray`
  - Render a Mantine `Accordion` mapping over the entries; use array index as item value (`item-0`, `item-1`, …)
  - Apply JSDoc to all functions and a file-level description block (per CLAUDE.md standards)
- [ ] T008 [US1] Add named export for `Faq` to `packages/frontend/src/pages/index.ts` (create the file if it does not exist; use the same export style as other pages if an index already exists)
- [ ] T009 [US1] Add `import { Faq } from './pages/Faq.js';` and `<Route path="/faq" element={<Faq />} />` inside the authenticated `<Routes>` block in `packages/frontend/src/main.tsx`
- [ ] T010 [US1] Add FAQ nav link to `appLinks` array in `packages/frontend/src/components/AppShell/NavbarSegmented.tsx`:
  - Label: `t('nav.faq')`
  - Route: `/faq`
  - Icon: `<IconHelp size={18} />` from `@tabler/icons-react`

**Checkpoint**: `pnpm --filter frontend test Faq` passes. Navigating to `/faq` shows the FAQ page with accordion. User Story 1 is fully functional.

---

## Phase 4: User Story 2 — Content Maintainability (Priority: P2)

**Goal**: A content maintainer can add, edit, or remove a FAQ entry by editing only the JSON translation files — no UI code changes required.

**Independent Test**: Edit `en.json` faq entry text, save, observe HMR update in browser — no code changes needed.

### Tests for User Story 2 ⚠️ Write FIRST — verify they FAIL before implementation

- [ ] T011 [US2] Write failing Vitest test in `packages/frontend/tests/unit/FaqContent.test.ts`:
  - Import `en.json` and `de.json` directly
  - Assert both have a `faq.items` property that is an `Array`
  - Assert both arrays have the same length
  - Assert each entry has non-empty `question` and `answer` string fields
  - Assert neither array is empty and has at most 10 entries

### Implementation for User Story 2

- [ ] T012 [P] [US2] Verify `packages/frontend/src/i18n/locales/en.json` `faq.items` entries from T003 are well-formed (non-empty question and answer, no placeholder left unfilled)
- [ ] T013 [P] [US2] Verify `packages/frontend/src/i18n/locales/de.json` `faq.items` entries from T004 are well-formed and match entry count in en.json

**Note**: T012 and T013 can run in parallel. The structural test T011 will catch any mismatch at CI time.

**Checkpoint**: `pnpm --filter frontend test FaqContent` passes. Both JSON files are well-formed and equal-length.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, README updates, and validation sweep required by CLAUDE.md.

- [ ] T014 [P] Update `README.md` to document the FAQ section: where to find it, how to edit content files
- [ ] T015 [P] Update `README.de.md` with the German equivalent of the README changes from T014
- [ ] T016 [P] Update `docs/user-guide.md` to document the FAQ page from a user perspective (navigation, accordion usage)
- [ ] T017 [P] Update `docs/user-guide.de.md` with the German equivalent of the user-guide changes from T016
- [ ] T018 Run the full quickstart validation from `specs/032-faq-section/quickstart.md` (all 5 scenarios) and confirm all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion; can run in parallel with Phase 3
- **Polish (Phase 5)**: Depends on Phases 3 and 4 completion

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 — independently testable after Foundational
- **US2 (P2)**: No dependency on US1 — independently testable after Foundational (tests JSON structure, no component needed)

### Within Each User Story

- Tests MUST be written and confirmed FAILING before implementation tasks start
- Component before route registration (T007 before T009)
- Route before nav link (T009 before T010)
- Structural tests (T011) before content verification (T012, T013)

### Parallel Opportunities

- T003 and T004 (en/de JSON additions) — different files, run in parallel
- T005 and T006 (unit test and E2E test writing) — different files, run in parallel after T002–T004
- T007, T008 — component and export can be done in the same pass
- T011, T012, T013 (US2 test + content verification) — T012 and T013 parallel after T011
- T014, T015, T016, T017 (docs) — all parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Write both tests simultaneously (different files):
Task: "Write Faq.test.tsx unit tests" (T005)
Task: "Write faq.spec.ts E2E test skeleton" (T006)
```

## Parallel Example: Foundational JSON

```bash
# After T002 is done, add FAQ content to both files simultaneously:
Task: "Add faq section to en.json" (T003)
Task: "Add faq section to de.json" (T004)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T004)
3. Complete Phase 3: User Story 1 (T005–T010)
4. **STOP and VALIDATE**: `pnpm --filter frontend test` passes; manual navigation to `/faq` works in both languages
5. Polish (T014–T018) before merging

### Incremental Delivery

1. Setup + Foundational → translation files ready, nav key available
2. US1 → FAQ page renders, navigation works → MVP
3. US2 → structural content tests in CI → content maintainability guaranteed
4. Polish → docs updated, all quickstart scenarios verified

---

## Notes

- [P] tasks operate on different files — safe to parallelize within the same session
- TDD is mandatory (constitution Principle I) — every implementation task must have a failing test committed first
- The `FaqEntry` type is local to `Faq.tsx` — it does not need to go in the shared package
- After T007, run `tsc --noEmit` to confirm no type errors before proceeding to T008
- All new/modified functions require JSDoc (CLAUDE.md standard); the Faq page has one main component function
