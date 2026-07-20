---

description: "Task list for feature implementation"
---

# Tasks: Summary Email Table Sorted by Monthly Cost

**Input**: Design documents from `/specs/038-summary-email-sort-by-cost/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Required — the project constitution's Principle I (Test-First, NON-NEGOTIABLE) mandates
a failing test before any implementation code, so test tasks below are not optional.

**Organization**: This feature has a single user story (US1). There is no Setup or
Foundational phase: the feature reuses all existing infrastructure (database connection,
`NotificationService`, `mailer.strings.ts` renderers) and adds no new project scaffolding,
dependency, schema, or shared abstraction — per Constitution Principle III (Simplicity/YAGNI),
no phase-filler tasks are invented where none are needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

Web app monorepo per [plan.md](./plan.md): `packages/backend/src/`, `packages/backend/tests/`,
plus repo-root documentation files (`README.md`, `README.de.md`, `docs/user-guide.md`,
`docs/user-guide.de.md`).

---

## Phase 1: User Story 1 - See highest-cost contracts first in the summary email (Priority: P1) 🎯 MVP

**Goal**: Reorder the summary email's active-contract table from alphabetical-by-name to
descending-by-monthly-cost (with a case-insensitive name tie-break), for both HTML and
plain-text renditions and all summary-email frequencies.

**Independent Test**: Generate a summary email for a user with multiple active contracts of
differing monthly costs and confirm the table rows are ordered highest-cost-first, regardless
of contract name; confirm tied costs fall back to alphabetical order.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Constitution Principle I)**

- [ ] T001 [US1] Add test "orders contracts by monthly cost descending" to the
  `describe('NotificationService.sendSummaryEmailForUser')` block in
  `packages/backend/tests/unit/notification.service.test.ts`: seed a user with three active
  contracts with distinct monthly costs (e.g. €12, €50, €120) inserted in a non-cost-sorted
  order, call `sendSummaryEmailForUser`, and assert the captured `SummaryEmailData.contracts`
  array's `monthlyCost` values are in non-increasing order (€120, €50, €12).
- [ ] T002 [US1] Add test "breaks ties by contract name ascending, case-insensitive" to the
  same `describe` block in
  `packages/backend/tests/unit/notification.service.test.ts`: seed two active contracts with
  equal `monthlyCost` but names in reverse alphabetical order (mixed case, e.g. "zebra" and
  "Apple"), call `sendSummaryEmailForUser`, and assert the captured `contracts` array lists
  "Apple" before "zebra".
- [ ] T003 [P] [US1] Add test "does not reorder when there are zero or one active contracts"
  to `packages/backend/tests/unit/notification.service.test.ts`: verify the existing
  no-contracts case (already covered by "sets ctaState to no-contracts...") and add a
  single-contract case asserting the `contracts` array still contains exactly that one row.
  Run `pnpm --filter backend test -- notification.service.test.ts` and confirm T001–T003 fail
  (current query has no cost ordering).

### Implementation for User Story 1

- [ ] T004 [US1] In `packages/backend/src/services/notification.service.ts`, sort the
  `contracts` array built at lines 172-177 (the `contractRows.map(...)` result assigned to
  `contracts`) by `monthlyCost` descending, with a case-insensitive ascending `name` tie-break
  comparator (e.g. `contracts.sort((a, b) => b.monthlyCost - a.monthlyCost || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))`).
  Do not change `totalMonthlySpending`, the `renewalRows`/`upcomingRenewals` computation, or
  any other field on `SummaryEmailData`.
- [ ] T005 [US1] Update the JSDoc on `sendSummaryEmailForUser` in
  `packages/backend/src/services/notification.service.ts` (currently at lines 136-141) to
  note that the returned/sent contract rows are ordered by monthly cost descending (ties
  broken by name), per Constitution's JSDoc requirement for changed function implementations.
- [ ] T006 [US1] Run `pnpm --filter backend test -- notification.service.test.ts` and confirm
  T001–T003 now pass, and run `pnpm --filter backend test` to confirm no other backend test
  (e.g. `mailer.service.test.ts`, `mailer.strings.test.ts`) regresses.
- [ ] T007 [US1] Run `pnpm --filter backend exec tsc --noEmit` (or the project's configured
  type-check script) to confirm strict-mode type safety is preserved (Constitution Principle II).

**Checkpoint**: User Story 1 is fully functional and independently testable — the summary
email's active-contract table is sorted by monthly cost descending with a deterministic tie-break.

---

## Phase 2: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates required by CLAUDE.md/constitution, and quality validation.

- [ ] T008 [P] Update the **Summary email** bullet in `README.md` (line 27, under Features) to
  state that the per-contract breakdown is ordered by monthly cost, highest first.
- [ ] T009 [P] Update the corresponding **Zusammenfassungs-E-Mail** bullet in `README.de.md`
  (line 27) with the equivalent German wording, keeping the two files consistent.
- [ ] T010 [P] Update the "What the email contains" section in `docs/user-guide.md`
  (the **Per-contract breakdown** bullet at line 485, under `## 11. Summary Email`) to state
  that contracts are listed ordered by monthly cost descending, with contracts of equal cost
  ordered alphabetically by name.
- [ ] T011 [P] Update the equivalent **Zusammenfassungs-E-Mail** section in
  `docs/user-guide.de.md` (`## 11. Zusammenfassungs-E-Mail`) with the same information in
  German, keeping both user-guide files consistent.
- [ ] T012 Run `pnpm --filter backend lint` (or repo-configured ESLint script) over
  `packages/backend/src/services/notification.service.ts` and
  `packages/backend/tests/unit/notification.service.test.ts` to confirm no new lint findings.
- [ ] T013 Analyze the modified files with SonarQube per `CLAUDE.md`'s SonarCloud workflow
  (`mcp__sonarqube__analyze_code_snippet` or
  `mcp__sonarqube__search_sonar_issues_in_projects` for project key
  `mallwang_personal-contract-management`) and confirm no new bugs, security hotspots, or
  critical code smells on `notification.service.ts`.
- [ ] T014 Execute the manual validation steps in [quickstart.md](./quickstart.md) (seed three
  differently-priced contracts, confirm HTML and plain-text rendition order match) to confirm
  SC-001 through SC-004.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (User Story 1)**: No prerequisite phase — this feature has no Setup/Foundational
  work. Can start immediately.
- **Phase 2 (Polish)**: Depends on Phase 1 (T001-T007) being complete, since documentation
  wording (T008-T011) and quality checks (T012-T013) describe/validate the finished behavior.

### Within Phase 1

- T001, T002 must be written and observed failing before T004 (Constitution Principle I).
- T003 is independent of T001/T002 (different assertions, same file) and can be written in
  parallel with them, but all of T001-T003 must fail before T004 begins.
- T004 depends on T001-T003 existing and failing.
- T005 depends on T004 (documents the behavior T004 introduces).
- T006 depends on T004 and T005.
- T007 depends on T004 (type-checks the implementation).

### Within Phase 2

- T008 and T009 are parallel (different files, no shared state).
- T010 and T011 are parallel (different files, no shared state).
- T008-T011 can all run in parallel with each other.
- T012 and T013 depend on T004 (the finished implementation) but not on the docs tasks.
- T014 depends on T004-T007 (needs the finished, tested implementation to validate against).

### Parallel Opportunities

- T003 [P] can be written alongside T001/T002 (same file, but additive/non-conflicting
  assertions — coordinate to avoid merge conflicts within the same test file).
- T008, T009, T010, T011 are all marked [P] — four independent documentation files.

---

## Parallel Example: Phase 2 documentation

```bash
Task: "Update README.md Summary email bullet with cost-ordering note"
Task: "Update README.de.md Zusammenfassungs-E-Mail bullet with cost-ordering note"
Task: "Update docs/user-guide.md Summary Email section with cost-ordering note"
Task: "Update docs/user-guide.de.md Zusammenfassungs-E-Mail section with cost-ordering note"
```

---

## Implementation Strategy

### MVP First (and Only) Scope

This feature has a single P1 user story with no smaller viable slice:

1. Complete Phase 1 (T001-T007): failing tests → sort implementation → passing tests → type-check.
2. **STOP and VALIDATE**: run the quickstart scenario manually to confirm the sort is visible
   in a real generated email.
3. Complete Phase 2 (T008-T014): documentation, lint, SonarQube, final quickstart validation.
4. Ship — there is no incremental second story to layer on afterward.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps every Phase 1 task to US1 for traceability; Phase 2 tasks are
  cross-cutting and carry no story label per the template's phase rules.
- Verify T001-T003 fail before starting T004.
- Commit after Phase 1 is green, and again after Phase 2 documentation/quality tasks.
- No Setup or Foundational phase, and no Complexity Tracking entries, were introduced —
  consistent with the plan's Constitution Check (Simplicity/YAGNI) finding no violations.
