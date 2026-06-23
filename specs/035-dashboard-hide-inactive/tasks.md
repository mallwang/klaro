---

description: "Task list for feature implementation"
---

# Tasks: Separate Inactive Contracts from Expired Contracts on Dashboard

**Input**: Design documents from `/specs/035-dashboard-hide-inactive/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-dashboard.md, quickstart.md

**Tests**: Required — the project constitution mandates Test-First (TDD) for all production code. Test tasks below MUST be completed (and observed failing) before the corresponding implementation tasks.

**Organization**: Tasks are grouped by user story (US1 = P1, US2 = P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Paths use the existing monorepo layout: `packages/backend/src/`, `packages/frontend/src/`, `packages/shared/src/`

---

## Phase 1: Setup

No new tooling, dependencies, or scaffolding is required — this feature reuses the existing
backend service, shared schema package, and frontend component/Accordion patterns already in
the repo. Phase skipped.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schema changes that User Story 2 depends on. (User Story 1 has no
foundational dependency — its query change is self-contained — but the schema is grouped here
because it is shared infrastructure, not story-specific behavior.)

- [ ] T001 [P] Add `InactiveContractSchema` (id, name, category, endDate nullable, anonymize, logoName, useGenericIcon) to `packages/shared/src/schemas/dashboard.ts`
- [ ] T002 [US2-dependency] Add `inactiveContracts: z.array(InactiveContractSchema)` field to `DashboardResponseSchema` in `packages/shared/src/schemas/dashboard.ts`, and export `InactiveContract` type (depends on T001)

**Checkpoint**: Shared schema ready — both stories can now proceed (US1 doesn't need it, US2 does).

---

## Phase 3: User Story 1 - Expired Contracts excludes inactive contracts (Priority: P1) 🎯 MVP

**Goal**: The dashboard's "Expired Contracts" section only shows contracts that are both
`status === 'ACTIVE'` and past their end date.

**Independent Test**: Seed one ACTIVE contract with a past end date and one INACTIVE contract
with a past end date; load the dashboard; confirm only the ACTIVE contract appears under
"Expired Contracts".

### Tests for User Story 1 ⚠️

> Write these first; confirm they FAIL before touching the implementation.

- [ ] T003 [US1] Add failing test in `packages/backend/src/services/dashboard.test.ts`: `getExpiredContracts`/`getDashboardData` excludes a contract with `status = 'INACTIVE'` and a past `end_date`
- [ ] T004 [P] [US1] Add failing test in `packages/backend/src/services/dashboard.test.ts`: `getExpiredContracts`/`getDashboardData` still includes an ACTIVE contract with a past `end_date` (regression guard for existing behavior)

### Implementation for User Story 1

- [ ] T005 [US1] Add `AND status = 'ACTIVE'` to the SQL `WHERE` clause in `getExpiredContracts` in `packages/backend/src/services/dashboard.ts` (depends on T003, T004 failing first)

**Checkpoint**: User Story 1 is fully functional and independently testable/deployable — this
alone fixes the reported bug.

---

## Phase 4: User Story 2 - Inactive contracts in a collapsed, muted section (Priority: P2)

**Goal**: A collapsed-by-default, visually muted "Inactive Contracts" section on the dashboard
lists all of the user's `INACTIVE` contracts, omitted entirely when there are none.

**Independent Test**: Seed one or more INACTIVE contracts; load the dashboard; confirm the
"Inactive Contracts" section renders collapsed with a count; expand it and confirm all INACTIVE
contracts are listed; remove all INACTIVE contracts and confirm the section disappears.

### Tests for User Story 2 ⚠️

> Write these first; confirm they FAIL before touching the implementation.

- [ ] T006 [P] [US2] Add failing test in `packages/backend/src/services/dashboard.test.ts`: `getInactiveContracts`/`getDashboardData` returns all contracts with `status = 'INACTIVE'` for the user, including ones with a null `endDate`, sorted by name
- [ ] T007 [P] [US2] Add failing test in `packages/backend/src/services/dashboard.test.ts`: `getInactiveContracts`/`getDashboardData` excludes other users' INACTIVE contracts (ownership scoping)
- [ ] T008 [P] [US2] Add failing test file `packages/frontend/src/components/InactiveContracts.test.tsx`: renders `null`/nothing when `inactiveContracts` is empty
- [ ] T009 [P] [US2] Add failing test case in `packages/frontend/src/components/InactiveContracts.test.tsx`: renders collapsed by default with a count matching the list length, and reveals all contract rows after the header is clicked

### Implementation for User Story 2

- [ ] T010 [US2] Implement private `getInactiveContracts(ownerId)` query in `packages/backend/src/services/dashboard.ts` per `data-model.md` (mirrors `getExpiredContracts`'s row-mapping shape, no `daysOverdue`) (depends on T001, T006, T007 failing first)
- [ ] T011 [US2] Wire `getInactiveContracts` into `getDashboardData` in `packages/backend/src/services/dashboard.ts`, adding `inactiveContracts` to the returned object (depends on T002, T010)
- [ ] T012 [US2] Create `packages/frontend/src/components/InactiveContracts.tsx`: Mantine `Accordion` (collapsed by default, muted/gray styling per the existing `Faq.tsx` pattern), header shows count, panel lists contracts (respecting per-contract `anonymize` per the project's anonymization invariant), returns `null` when the list is empty (depends on T008, T009 failing first)
- [ ] T013 [US2] Add `dashboard.inactiveContracts` and related i18n keys (section title, count label) to `packages/frontend/src/locales/en/translation.json`
- [ ] T014 [P] [US2] Add matching German i18n keys to `packages/frontend/src/locales/de/translation.json`
- [ ] T015 [US2] Render `<InactiveContracts inactiveContracts={data.inactiveContracts} />` in a new `<section>` below the existing "Expired Contracts" section in `packages/frontend/src/pages/Dashboard.tsx` (depends on T012, T013, T014)

**Checkpoint**: Both user stories are independently functional; full feature is complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T016 [P] Update `README.md` and `README.de.md` to document the narrowed "Expired Contracts" behavior and the new "Inactive Contracts" section, per CLAUDE.md documentation requirements
- [ ] T017 [P] Update `docs/user-guide.md` and `docs/user-guide.de.md` with the new "Inactive Contracts" section behavior (how to reach it, that it's collapsed/empty-omitted), per CLAUDE.md documentation requirements
- [ ] T018 Verify/extend JSDoc on `getExpiredContracts`, the new `getInactiveContracts`, and `InactiveContracts.tsx` per CLAUDE.md JSDoc requirements
- [ ] T019 Run `quickstart.md` validation steps end-to-end against a local dev environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Skipped (no new tooling needed)
- **Foundational (Phase 2)**: No dependencies — BLOCKS only User Story 2 (US1 does not need the schema change)
- **User Story 1 (Phase 3)**: Can start immediately, in parallel with Phase 2 — fully independent
- **User Story 2 (Phase 4)**: Depends on Phase 2 (T001, T002) completing
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on User Story 2. Touches `getExpiredContracts` only.
- **User Story 2 (P2)**: Depends on the Foundational schema tasks (T001, T002). Touches
  `getInactiveContracts` (new method) and `getDashboardData` (same file as US1's change, but a
  different line — sequence T005 before T011 to avoid merge conflicts if worked on serially;
  if parallelized by different people, rebase/merge `dashboard.ts` carefully).

### Parallel Opportunities

- T001 can run alongside Phase 3 (US1) entirely.
- T004 [P] can run alongside T003 (different assertions, same new test file — write together).
- T006, T007, T008, T009 [P] can all be written in parallel (two different test files, independent assertions).
- T014 [P] can run alongside T013 (different locale files).
- T016, T017 [P] can run in parallel (different doc files).

---

## Parallel Example: User Story 2 tests

```bash
# Launch all four failing tests for User Story 2 together:
Task: "Add failing test: getInactiveContracts returns all INACTIVE contracts including null endDate, in packages/backend/src/services/dashboard.test.ts"
Task: "Add failing test: getInactiveContracts excludes other users' INACTIVE contracts, in packages/backend/src/services/dashboard.test.ts"
Task: "Add failing test: InactiveContracts renders nothing when empty, in packages/frontend/src/components/InactiveContracts.test.tsx"
Task: "Add failing test: InactiveContracts renders collapsed with count and expands on click, in packages/frontend/src/components/InactiveContracts.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 partially is NOT required for US1 — skip straight to Phase 3.
2. Complete Phase 3: User Story 1 (T003–T005).
3. **STOP and VALIDATE**: Confirm expired contracts no longer include inactive ones (quickstart.md step 1).
4. This alone ships the reported bug fix.

### Incremental Delivery

1. Ship User Story 1 (the bug fix) first — smallest possible change, one line of SQL plus tests.
2. Add Foundational schema (T001–T002) + User Story 2 (T010–T015) → the new collapsible section.
3. Polish (docs, JSDoc, quickstart validation) last.

---

## Notes

- [P] tasks touch different files or independent regions of a shared test file with no
  ordering dependency.
- Per the project constitution, every test task must be written and observed failing before its
  paired implementation task.
- Per the project's anonymization invariant, `InactiveContracts.tsx` must respect each
  contract's `anonymize` flag and the global anonymize toggle, exactly as `ExpiredContracts.tsx`
  and `UpcomingRenewals.tsx` already do.
- Commit after each task or logical group; stop at either checkpoint to validate a story independently.
