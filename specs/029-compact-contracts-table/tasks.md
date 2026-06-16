# Tasks: Compact Contracts Table

**Input**: Design documents from `specs/029-compact-contracts-table/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Files changed**: 2 source files, 1 test file. No new files, no backend changes, no shared-package changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Paths relative to repo root

---

## Phase 1: Setup

**Purpose**: Confirm the baseline state before any changes.

- [X] T001 Run existing ContractTable unit tests and confirm all 24 pass: `pnpm --filter frontend test --run ContractTable`

**Checkpoint**: All existing tests green — safe to proceed.

---

## Phase 2: User Story 1 — Compact Single-Line Rows (Priority: P1) 🎯 MVP

**Goal**: Each contract row fits on a single line at desktop widths. Long names truncate with ellipsis instead of expanding row height.

**Independent Test**: Render a contract with a 50-character name; confirm the name cell wraps the text in a `Text` component (verifiable in jsdom) and the table element has reduced vertical spacing applied.

### Tests for User Story 1 (TDD — write and confirm FAILING before implementing)

- [X] T002 [US1] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "name cell wraps contract name in a Mantine Text element" — render a single contract and verify `screen.getByText('Netflix').closest('[data-mantine-component]')` or the `<p>` / `<span>` emitted by `<Text>` is present wrapping the name text; confirm the test FAILS before implementation
- [X] T003 [P] [US1] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "Edit link is accessible as an anchor pointing to the contract edit path" — query `screen.getAllByRole('link', { name: /edit/i })` and assert `href` contains `/contracts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit`; confirm the test PASSES already (Anchor also renders as a link — this is a regression guard, not a change detector)

### Implementation for User Story 1

- [X] T004 [US1] In `packages/frontend/src/components/ContractTable.module.css`, update `.nameCell`: add `min-width: 0; overflow: hidden;` to allow the flex child to shrink and enable ellipsis clipping
- [X] T005 [US1] In `packages/frontend/src/components/ContractTable.tsx`, add `Text` to the Mantine import list (if not already present); wrap the `{resolveName(contract)}` expression in `<Text size="sm" fw={500} truncate="end">` inside the `nameCell` div, removing the raw text node
- [X] T006 [US1] In `packages/frontend/src/components/ContractTable.tsx`, add `verticalSpacing="xs"` prop to the `<Table>` component to tighten row height

**Checkpoint**: Run `pnpm --filter frontend test --run ContractTable` — all tests including T002–T003 must pass. Visually verify in dev server: long names truncate with ellipsis, rows are noticeably more compact.

---

## Phase 3: User Story 2 — Consistent Action Buttons (Priority: P2)

**Goal**: Edit and Delete buttons in the contracts table are visually identical to action buttons in the Manage Accounts table (`size="compact-sm" variant="default"`).

**Independent Test**: In the rendered table, the Edit element is a Mantine Button (not an Anchor), and the Delete element in default state has `variant="default"` (no implicit red styling).

### Tests for User Story 2 (TDD — write and confirm FAILING before implementing)

- [X] T007 [US2] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "Edit action does not render as an anchor with Mantine Anchor class" — after implementing, `screen.getAllByRole('link', { name: /edit/i })[0]` should NOT have the `mantine-Anchor-root` CSS class. Confirmed FAILING before implementation.

### Implementation for User Story 2

- [X] T008 [US2] In `packages/frontend/src/components/ContractTable.tsx`, remove the `Anchor` import; `Button` and `Link` were already imported
- [X] T009 [US2] In `packages/frontend/src/components/ContractTable.tsx`, replace `<Anchor component={Link} to={...}>` with `<Button size="compact-sm" variant="default" component={Link} to={...}>`
- [X] T010 [US2] In `packages/frontend/src/components/ContractTable.tsx`, change Delete button from `variant="subtle" color="red"` to `variant="default"`; also updated Cancel confirmation button from `variant="subtle" color="gray"` to `variant="default"`

**Checkpoint**: Run `pnpm --filter frontend test --run ContractTable` — all 29 tests pass. ✅

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, JSDoc, and final validation.

- [X] T011 [P] In `packages/frontend/src/components/ContractTable.tsx`, update file-level and function-level JSDoc blocks to reflect compact rows, truncated names, and Button action pattern
- [X] T012 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` — added compact row description, ellipsis note, and Row Actions section
- [X] T013 [P] Update `README.md` and `README.de.md` — updated Contract list bullet to mention compact layout and truncated names
- [ ] T014 Run the full quickstart.md validation scenarios S1–S8 manually in the dev server (`pnpm dev`) to confirm all acceptance criteria are met
- [X] T015 SonarCloud analysis: 0 issues found on ContractTable.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 passing
- **Phase 3 (US2)**: Depends on Phase 1 passing; can start in parallel with Phase 2 (different logical change, but same file — serialize to avoid conflicts)
- **Phase 4 (Polish)**: Depends on Phase 2 and Phase 3 completion

### User Story Dependencies

- **US1 (P1)**: Depends only on baseline passing
- **US2 (P2)**: Depends only on baseline passing; logically independent of US1 but touches the same file — implement sequentially after US1

### Within Each User Story

1. Write tests (TDD) → confirm failing → implement → confirm passing
2. CSS change (T004) before JSX change (T005) within US1 — the CSS `min-width: 0` is required for ellipsis to work
3. Import cleanup (T008) before component edit (T009–T010) within US2

---

## Parallel Opportunities

```bash
# Within Phase 2 — T002 and T003 can be written together (both in the test file):
Task T002: "name cell wraps contract name in a Mantine Text element"
Task T003: "Edit link is accessible as an anchor pointing to the contract edit path"

# Within Phase 4 — all polish tasks [P] can run together:
Task T011: Update JSDoc in ContractTable.tsx
Task T012: Update user-guide.md and user-guide.de.md
Task T013: Check and update README files
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. T001 — baseline verification
2. T002–T003 — write failing tests
3. T004–T006 — implement compact rows + truncation
4. Confirm all tests pass, visual check in dev server
5. **STOP and validate**: compact single-line rows are the most impactful change

### Full delivery

1. MVP above
2. T007 — write failing button-style test
3. T008–T010 — implement action button style alignment
4. T011–T015 — polish, docs, SonarCloud scan

---

## Notes

- T004 (CSS) must precede T005 (JSX) — `overflow: hidden` on the container is required for `Text truncate` to clip
- T014 (manual dev server validation) is left for the user to complete
- No backend changes, no pnpm install, no new packages — zero setup friction
