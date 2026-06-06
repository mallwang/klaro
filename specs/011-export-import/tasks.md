# Tasks: Contract Export and Import

**Input**: Design documents from `specs/011-export-import/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Constitution**: TDD is NON-NEGOTIABLE. Tests MUST be written first and confirmed failing before implementation begins. No exceptions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Install the one new dependency and add the import route before any feature work begins.

- [X] T001 Add `xlsx` dependency to `packages/frontend/package.json` and run `pnpm install`
- [X] T002 [P] Add `/contracts/import` route to the router in `packages/frontend/src/main.tsx` (lazy-import `ContractImport` page; page file need not exist yet)
- [X] T003 [P] Define `TargetField`, `ColumnMapping`, `ParsedImportFile`, and `ImportResult` TypeScript types in `packages/frontend/src/utils/columnMapping.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement and verify the core column-mapping algorithm that every import user story depends on.

**⚠️ CRITICAL**: US2 and US3 cannot begin until this phase is complete.

- [X] T004 Write failing unit tests for `normalizeColumn` and `inferMapping` covering exact synonym matches, case-insensitive variants, unknown columns (→ null), and system fields (id, createdAt, updatedAt → auto-skip) in `packages/frontend/tests/unit/columnMapping.test.ts`
- [X] T005 Implement `normalizeColumn` (trim + lowercase) and `inferMapping` (synonym table lookup → `ColumnMapping[]`) in `packages/frontend/src/utils/columnMapping.ts` — tests from T004 must pass; no `any` types

**Checkpoint**: `pnpm --filter frontend test -- columnMapping` passes. Foundation ready for all user stories.

---

## Phase 3: User Story 1 — Export All Contracts to File (Priority: P1) 🎯 MVP

**Goal**: Users can download all contracts as `.xlsx` or `.json` from the contracts list page.

**Independent Test**: Open `http://localhost:5173/contracts`, click Export → JSON / Export → Excel, open the downloaded files, and verify all contracts appear with correct field names and values (see `quickstart.md` Scenarios 1–2).

### Tests (write first — must fail before implementing)

- [X] T006 [P] [US1] Write failing unit tests for `exportToJson` (JSON array, nested `cancellationPeriod`) and `exportToExcel` (flat row, dot-notation columns, column order) in `packages/frontend/tests/unit/exportService.test.ts`
- [X] T007 [P] [US1] Write failing Playwright e2e test: click Export → JSON, assert download; click Export → Excel, assert download — create `packages/frontend/tests/e2e/exportImport.spec.ts`

### Implementation

- [X] T008 [US1] Implement `exportToJson(contracts: ContractData[]): void` and `exportToExcel(contracts: ContractData[]): void` in `packages/frontend/src/services/export.ts`; include `cancellationPeriod` flattening for Excel; trigger browser download via `URL.createObjectURL`; make T006 pass
- [X] T009 [US1] Implement `ExportMenu` component (dropdown with "Export to JSON" and "Export to Excel" items, calls export functions from T008) in `packages/frontend/src/components/ExportMenu.tsx`
- [X] T010 [US1] Add `ExportMenu` to the header of `packages/frontend/src/pages/ContractList.tsx` next to the "Add contract" button; verify T007 e2e test passes

**Checkpoint**: Both export formats work in the browser. `pnpm --filter frontend test` and T007 e2e pass. User Story 1 is independently functional.

---

## Phase 4: User Story 2 — Import Contracts with Automatic Column Mapping (Priority: P2)

**Goal**: Users upload an Excel or JSON file with non-standard column names, see an auto-generated mapping preview, confirm, and the system creates the contracts, reporting any failures.

**Independent Test**: Upload a file with columns "Contract Name", "Monthly Cost", "Billing Frequency", "Type" — mapping preview shows all four correctly auto-mapped — confirm — contracts appear in the list (see `quickstart.md` Scenario 3).

### Tests (write first — must fail before implementing)

- [X] T011 [P] [US2] Write failing unit tests for `parseExcelFile`, `parseJsonFile` (columns extracted, rows as string records, multi-sheet warning), `buildCreateContractBody` (valid row → `CreateContractBody`; missing required field → error), and `runImport` (partial failure: valid rows created, invalid rows collected into `ImportResult`) in `packages/frontend/tests/unit/importParsing.test.ts`
- [X] T012 [P] [US2] Add failing Playwright e2e test to `packages/frontend/tests/e2e/exportImport.spec.ts`: upload a JSON file with non-standard column names, assert mapping preview is shown, confirm, assert result summary shows 1 created

### Implementation

- [X] T013 [US2] Implement `parseExcelFile(file: File): Promise<ParsedImportFile>` and `parseJsonFile(file: File): Promise<ParsedImportFile>` in `packages/frontend/src/services/importParsing.ts`; use `xlsx` for Excel; reject files > 5 MB; add warning when multiple sheets detected; make T011 parsing tests pass
- [X] T014 [US2] Implement `buildCreateContractBody(row, mappings): CreateContractBody | Error` and `runImport(rows, mappings, createFn): Promise<ImportResult>` in `packages/frontend/src/services/importParsing.ts`; reassemble `cancellationPeriod` from `.value` / `.unit` columns; normalise `anonymize` (true/1/yes → true); make T011 import tests pass
- [X] T015 [P] [US2] Implement read-only `ColumnMappingTable` component (table of source column → target field label; "Unmapped" for null; uses `ColumnMapping[]` prop) in `packages/frontend/src/components/ColumnMappingTable.tsx`
- [X] T016 [P] [US2] Implement `ImportResultSummary` component (shows total / created / failed count; lists failed row numbers with messages; "Import another file" reset button) in `packages/frontend/src/components/ImportResultSummary.tsx`
- [X] T017 [US2] Implement `ContractImport` page in `packages/frontend/src/pages/ContractImport.tsx` with state machine: Idle → file input → Parsing → MappingReview (shows `ColumnMappingTable` + Confirm button) → Importing (calls `runImport` using `useCreateContract`) → Done (shows `ImportResultSummary`); verify T012 e2e passes

**Checkpoint**: Full import flow works for files with non-standard headers. `pnpm --filter frontend test` and T012 e2e pass. User Story 2 is independently functional.

---

## Phase 5: User Story 3 — Correct the Mapping Before Importing (Priority: P3)

**Goal**: Users can change any auto-mapped column to a different field or mark it as "Skip"; the Confirm button is disabled if a required field (`name`, `amount`, `billingInterval`, `category`) remains unmapped.

**Independent Test**: Upload a file with an unmapped column ("Vendor") and a mis-mapped column; reassign both in the preview; confirm — import uses the corrected mapping (see `quickstart.md` Scenario 4).

### Tests (write first — must fail before implementing)

- [X] T018 [P] [US3] Add failing unit tests to `packages/frontend/tests/unit/columnMapping.test.ts` for the `REQUIRED_TARGET_FIELDS` constant and an `isMappingComplete(mappings: ColumnMapping[]): boolean` helper
- [X] T019 [P] [US3] Add failing Playwright e2e tests to `packages/frontend/tests/e2e/exportImport.spec.ts`: (a) change a field assignment via dropdown and confirm correct import; (b) mark a column Skip and confirm it is excluded; (c) unmap a required field and assert Confirm is disabled

### Implementation

- [X] T020 [US3] Add `REQUIRED_TARGET_FIELDS` constant and `isMappingComplete` helper to `packages/frontend/src/utils/columnMapping.ts`; make T018 pass
- [X] T021 [US3] Upgrade `ColumnMappingTable` in `packages/frontend/src/components/ColumnMappingTable.tsx` to accept an `onChange(updated: ColumnMapping[]): void` prop; render a `<select>` per row with all `TargetField` options plus "Unmapped" and "Skip"; make T019a and T019b pass
- [X] T022 [US3] Wire `ColumnMappingTable` onChange into `ContractImport` state in `packages/frontend/src/pages/ContractImport.tsx`; disable Confirm button when `!isMappingComplete(mappings)`; make T019c pass

**Checkpoint**: Mapping override and required-field blocking work. All T018–T019 tests pass. User Story 3 complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: i18n strings, edge-case hardening, and round-trip validation.

- [X] T023 [P] Add i18n translation keys for all export/import UI strings (button labels, mapping table headers, result summary, error messages) to `packages/frontend/src/i18n/locales/en.json` and `packages/frontend/src/i18n/locales/de.json`; update all new components to use `useTranslation()`
- [X] T024 [P] Add Playwright round-trip e2e test to `packages/frontend/tests/e2e/exportImport.spec.ts`: export to JSON → import that JSON file → assert all columns auto-map at confidence 1.0 → confirm → verify contracts are created
- [X] T025 Run full test suite (`pnpm test`) and manually work through all six scenarios in `specs/011-export-import/quickstart.md`; fix any failures before declaring feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 and T003 are parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS US2 and US3
- **US1 (Phase 3)**: Depends on Phase 1 only (no mapping logic needed for export)
- **US2 (Phase 4)**: Depends on Phase 2 (uses `inferMapping` from T005)
- **US3 (Phase 5)**: Depends on Phase 4 (extends `ColumnMappingTable` from T015 and state from T017)
- **Polish (Phase 6)**: Depends on all user story phases complete

### Within Each User Story

- Tests (T00n) MUST be written first; confirm they fail before implementing
- Parsing/utility functions before components that consume them
- Components before the page that composes them

### Parallel Opportunities per Phase

```
Phase 1:  T002 ║ T003          (different files, no deps)
Phase 2:  T004 → T005          (sequential: test then implement)
Phase 3:  T006 ║ T007          (different files)
          T006 → T008 → T009 → T010   (sequential: test → impl → component → integration)
Phase 4:  T011 ║ T012          (different test files)
          T013 → T014          (sequential within importParsing.ts)
          T015 ║ T016          (different component files, both depend only on types from T003)
          T015 + T016 + T014 → T017   (page composes all three)
Phase 5:  T018 ║ T019          (different test additions)
          T020 → T021 → T022   (sequential: helper → component → page)
Phase 6:  T023 ║ T024          (different files)
          T023 + T024 → T025   (final validation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 3: US1 — Export (can skip Phase 2 entirely for export-only MVP)
3. **STOP**: Test both export formats manually → validate Scenarios 1–2 from `quickstart.md`

### Full Incremental Delivery

1. Phase 1 → Phase 2 (Setup + Foundation)
2. Phase 3 (US1 Export) → validate independently
3. Phase 4 (US2 Import + auto-mapping) → validate independently
4. Phase 5 (US3 Manual override) → validate independently
5. Phase 6 (Polish + round-trip) → final validation

---

## Notes

- `[P]` = different files, no blocking deps on other in-progress tasks in the same phase
- TDD: every unit must have a failing test before implementation starts (constitution Principle I)
- `xlsx` (SheetJS) is a browser-compatible package; do not import it on the backend
- System fields (`id`, `createdAt`, `updatedAt`) are auto-skipped in mapping — never sent to the API
- `cancellationPeriod` requires BOTH `.value` and `.unit` to be mapped and non-empty to assemble the nested object; if only one is present, treat `cancellationPeriod` as `null`
- Enum values (`category`, `billingInterval`, `status`, `cancellationPeriod.unit`) are normalised to uppercase during import but no synonym translation is applied (e.g., "subscriptions" → "SUBSCRIPTIONS" is fine; "streaming" → error)
