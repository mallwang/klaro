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

- [ ] T001 Run existing ContractTable unit tests and confirm all 24 pass: `pnpm --filter frontend test --run ContractTable`

**Checkpoint**: All existing tests green — safe to proceed.

---

## Phase 2: User Story 1 — Compact Single-Line Rows (Priority: P1) 🎯 MVP

**Goal**: Each contract row fits on a single line at desktop widths. Long names truncate with ellipsis instead of expanding row height.

**Independent Test**: Render a contract with a 50-character name; confirm the name cell wraps the text in a `Text` component (verifiable in jsdom) and the table element has reduced vertical spacing applied.

### Tests for User Story 1 (TDD — write and confirm FAILING before implementing)

- [ ] T002 [US1] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "name cell wraps contract name in a Mantine Text element" — render a single contract and verify `screen.getByText('Netflix').closest('[data-mantine-component]')` or the `<p>` / `<span>` emitted by `<Text>` is present wrapping the name text; confirm the test FAILS before implementation
- [ ] T003 [P] [US1] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "Edit link is accessible as an anchor pointing to the contract edit path" — query `screen.getAllByRole('link', { name: /edit/i })` and assert `href` contains `/contracts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/edit`; confirm the test PASSES already (Anchor also renders as a link — this is a regression guard, not a change detector)

### Implementation for User Story 1

- [ ] T004 [US1] In `packages/frontend/src/components/ContractTable.module.css`, update `.nameCell`: add `min-width: 0; overflow: hidden;` to allow the flex child to shrink and enable ellipsis clipping
- [ ] T005 [US1] In `packages/frontend/src/components/ContractTable.tsx`, add `Text` to the Mantine import list (if not already present); wrap the `{resolveName(contract)}` expression in `<Text size="sm" fw={500} truncate="end">` inside the `nameCell` div, removing the raw text node
- [ ] T006 [US1] In `packages/frontend/src/components/ContractTable.tsx`, add `verticalSpacing="xs"` prop to the `<Table>` component (line 139) to tighten row height

**Checkpoint**: Run `pnpm --filter frontend test --run ContractTable` — all tests including T002–T003 must pass. Visually verify in dev server: long names truncate with ellipsis, rows are noticeably more compact.

---

## Phase 3: User Story 2 — Consistent Action Buttons (Priority: P2)

**Goal**: Edit and Delete buttons in the contracts table are visually identical to action buttons in the Manage Accounts table (`size="compact-sm" variant="default"`).

**Independent Test**: In the rendered table, the Edit element is a Mantine Button (not an Anchor), and the Delete element in default state has `variant="default"` (no implicit red styling).

### Tests for User Story 2 (TDD — write and confirm FAILING before implementing)

- [ ] T007 [US2] In `packages/frontend/tests/unit/ContractTable.test.tsx`, add test: "Edit action does not render as an anchor with Mantine Anchor class" — after implementing, `screen.getAllByRole('link', { name: /edit/i })[0]` should NOT have the `mantine-Anchor-root` CSS class (i.e. it changed from Anchor to Button component). Write and confirm test FAILS before implementation (currently the Anchor class IS present).

### Implementation for User Story 2

- [ ] T008 [US2] In `packages/frontend/src/components/ContractTable.tsx`, add `Button` to the Mantine imports if not already imported (it is — line 5); also ensure `Link` from `react-router-dom` is imported (it is — line 2); remove the `Anchor` import since it will no longer be used
- [ ] T009 [US2] In `packages/frontend/src/components/ContractTable.tsx`, in the default-state actions group (lines 231–244), replace `<Anchor component={Link} to={...} size="sm">{t('common.edit')}</Anchor>` with `<Button size="compact-sm" variant="default" component={Link} to={`/contracts/${contract.id}/edit`}>{t('common.edit')}</Button>`
- [ ] T010 [US2] In `packages/frontend/src/components/ContractTable.tsx`, in the same default-state group, change the Delete button from `variant="subtle" color="red"` to `variant="default"` (remove the `color="red"` prop) — the button label and `onClick` remain unchanged

**Checkpoint**: Run `pnpm --filter frontend test --run ContractTable` — all tests including T007 must pass. Visual check: Edit looks like a bordered compact button matching the Archive/Reactivate buttons in Manage Accounts; Delete in default state has no red colour.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, JSDoc, and final validation.

- [ ] T011 [P] In `packages/frontend/src/components/ContractTable.tsx`, update the file-level JSDoc block to reflect the style changes (compact rows, truncated names, `Button` action pattern)
- [ ] T012 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` — note that the Contracts table is now more compact; long contract names are truncated in the table view (full name visible on the edit page)
- [ ] T013 [P] Update `README.md` and `README.de.md` if either mentions the contracts table layout (check and update only if relevant — minimal change expected)
- [ ] T014 Run the full quickstart.md validation scenarios S1–S8 manually in the dev server (`pnpm dev`) to confirm all acceptance criteria are met
- [ ] T015 Run SonarCloud analysis on changed files: `mcp__sonarqube__analyze_code_snippet` on `ContractTable.tsx` and `ContractTable.module.css`; resolve any new issues before merging

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
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
- T008 (remove Anchor import) should be done last within US2 — only after T009 confirms no remaining `<Anchor>` usage in the file
- No backend changes, no pnpm install, no new packages — zero setup friction
- The `Anchor` component can be removed from imports entirely once T009 is done; verify with TypeScript (`tsc --noEmit`) that no other usage remains in the file
