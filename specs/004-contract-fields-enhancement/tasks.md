# Tasks: Contract Fields Enhancement

**Input**: Design documents from `specs/004-contract-fields-enhancement/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/api.md](contracts/api.md)

**TDD Requirement** (Constitution Principle I — NON-NEGOTIABLE): Every `[TEST]` task MUST be completed and the tests confirmed to **fail** before its corresponding implementation tasks are started. Do not skip this step.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (touches a different file, no unresolved dependencies)
- **[Story]**: Maps to user stories US1, US2, US3 from spec.md
- **[TEST]**: Write this test first — verify it **fails** — then implement

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, Zod schemas, DB migration, and updated service layer that all three user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] [TEST] Update `packages/backend/tests/unit/migration.test.ts`: seed an in-memory SQLite DB using the old schema (no new columns), call `runMigrations`, then assert all five new columns exist (`start_date`, `details`, `service_url`, `cancellation_period_value`, `cancellation_period_unit`) and that existing rows have `NULL` for each new column. Run test — confirm it **fails**.
- [x] T002 [P] [TEST] Extend `packages/backend/tests/unit/contract.service.test.ts`: add a test asserting that creating a contract with `startDate`, `details`, `serviceUrl`, and `cancellationPeriod` populated returns all four fields in the result; add a test asserting that creating with all four as `null`/`undefined` succeeds without error. Run tests — confirm they **fail**.
- [x] T003 Add `CancellationPeriodUnit` const enum (`DAYS`, `WEEKS`, `MONTHS`) + `type CancellationPeriodUnit` + `CANCELLATION_PERIOD_UNIT_LABELS` record; extend the `Contract` interface with `startDate: string | null`, `details: string | null`, `serviceUrl: string | null`, `cancellationPeriod: { value: number; unit: CancellationPeriodUnit } | null` in `packages/shared/src/types/contract.ts`
- [x] T004 Add `CancellationPeriodUnitSchema` (Zod enum) and `CancellationPeriodSchema` (Zod object: `value: z.number().int().positive()` + `unit`); extend `ContractSchema` with the four new nullable fields; extend `CreateContractBodySchema` and `UpdateContractBodySchema` with the same fields as optional/nullable — include `z.string().url()` for `serviceUrl` and `z.string().max(2000)` for `details` in `packages/shared/src/schemas/contract.ts` *(depends on T003)*
- [x] T005 Add five nullable column definitions to `packages/backend/src/db/schema.sql`: `start_date TEXT`, `details TEXT CHECK(details IS NULL OR length(details) <= 2000)`, `service_url TEXT`, `cancellation_period_value INTEGER`, `cancellation_period_unit TEXT CHECK(cancellation_period_unit IS NULL OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS'))`
- [x] T006 In `packages/backend/src/db/client.ts`: extend `ContractRow` interface with five new nullable fields (`start_date: string | null`, `details: string | null`, `service_url: string | null`, `cancellation_period_value: number | null`, `cancellation_period_unit: string | null`); add a second migration block to `runMigrations` — after the existing `billing_interval` block — that detects absence of `start_date` via `PRAGMA table_info(contracts)` and runs five `ALTER TABLE contracts ADD COLUMN` statements *(depends on T005)*
- [x] T007 In `packages/backend/src/services/contract.ts`: update `rowToContract` to map the five new DB columns (assembling `cancellationPeriod: { value, unit }` when both columns are non-null, otherwise `null`); update the `create` INSERT to include all five new columns using `body.startDate ?? null`, `body.details ?? null`, `body.serviceUrl ?? null`, and the two cancellation columns; update the `update` SET clause to handle all four new body fields *(depends on T004, T006)*

**Checkpoint**: Run `pnpm -w test` — migration test (T001) and service create-field tests (T002) should now pass. All existing tests must remain green.

---

## Phase 3: User Story 1 — Create with New Fields (Priority: P1) 🎯 MVP

**Goal**: A user creating a new contract can optionally fill in start date, details, service URL, and cancellation period — all four fields are persisted and visible in the edit form after saving.

**Independent Test**: Create a contract via the UI with all four new fields populated → navigate to edit → confirm all four fields are pre-filled with the entered values.

- [x] T008 [P] [TEST] [US1] Extend `packages/backend/tests/integration/contracts.route.test.ts` with three new test cases: (a) POST with valid `startDate`, `details`, `serviceUrl`, `cancellationPeriod` → 201 response body contains all four fields; (b) POST with `serviceUrl: "not-a-url"` → 400; (c) POST with `details` string of 2001 characters → 400. Run — confirm they **fail** (or pass if schema already enforces — verify behaviour is correct in both paths).
- [x] T009 [P] [TEST] [US1] Extend `packages/frontend/tests/unit/ContractForm.test.tsx` with failing assertions: (a) start date input renders; (b) details textarea renders with a character counter showing `"0/2000"`; (c) counter updates as text is typed; (d) service URL input renders; (e) when `defaultValues.serviceUrl` is a valid URL an anchor link is rendered; (f) cancellation period number input and unit select render; (g) submitting with `cancellationPeriodValue = "30"` and unit `"DAYS"` passes `cancellationPeriod: { value: 30, unit: "DAYS" }` to `onSubmit`; (h) submitting with empty `cancellationPeriodValue` passes `cancellationPeriod: null`. Run — confirm they **fail**.
- [x] T010 [US1] Extend `packages/frontend/src/components/ContractForm.tsx`: (a) add `startDate`, `details`, `serviceUrl`, `cancellationPeriodValue`, `cancellationPeriodUnit` to `ContractFormValues` interface and `useState` initializer (default unit: `'MONTHS'`); (b) add `startDate` field (`<input type="date">`); (c) add `details` field (`<textarea>` with live `{details.length}/2000` counter — counter text red when `details.length >= 1900`); (d) add `serviceUrl` field (`<input type="url">`) plus an `<a href={...} target="_blank">` anchor rendered below when the value is non-empty and parses as a valid `URL`; (e) add `cancellationPeriod` field: `<input type="number" min="1">` alongside `<select>` populated from `CANCELLATION_PERIOD_UNIT_LABELS`; (f) update `handleSubmit` to include `startDate: values.startDate || null`, `details: values.details || null`, `serviceUrl: values.serviceUrl || null`, and assembled `cancellationPeriod` *(depends on T003, T004, T009 failing confirmed)*

**Checkpoint**: Run frontend unit tests — T009 assertions should now pass. Test US1 manually using `quickstart.md` Scenario 1 and 2.

---

## Phase 4: User Story 2 — Update Existing Contract (Priority: P2)

**Goal**: A user editing an existing contract (including one created before this feature) can add or update the four new fields.

**Independent Test**: Open an existing contract in edit mode → populate all four new fields → save → re-open → confirm all four values are pre-filled.

- [x] T011 [P] [TEST] [US2] Add failing update-path assertions to `packages/backend/tests/unit/contract.service.test.ts`: (a) calling `update` with a new `serviceUrl` returns the updated URL; (b) calling `update` with `cancellationPeriod: null` clears both DB columns (returned `cancellationPeriod` is `null`). Run — confirm they **fail**.
- [x] T012 [P] [TEST] [US2] Add failing PUT assertions to `packages/backend/tests/integration/contracts.route.test.ts`: (a) `PUT` with `{ cancellationPeriod: { value: 14, unit: "WEEKS" } }` → 200 response has updated field; (b) `PUT` with `{ cancellationPeriod: null }` → 200 response has `cancellationPeriod: null`; (c) `PUT` with `{ serviceUrl: "not-a-url" }` → 400. Run — confirm they **fail**.
- [x] T013 [P] [TEST] [US2] Update `packages/frontend/tests/unit/ContractEdit.test.tsx`: mock contract data to include `startDate: "2024-01-15"`, `details: "Test notes"`, `serviceUrl: "https://example.com"`, `cancellationPeriod: { value: 30, unit: "DAYS" }`; assert the rendered `ContractForm` receives matching `defaultValues` for all four fields. Run — confirm the test **fails**.
- [x] T014 [US2] Update `packages/frontend/src/pages/ContractEdit.tsx`: pass four new fields as `defaultValues` to `ContractForm` — `startDate: contract.startDate ?? ''`, `details: contract.details ?? ''`, `serviceUrl: contract.serviceUrl ?? ''`, `cancellationPeriodValue: contract.cancellationPeriod ? String(contract.cancellationPeriod.value) : ''`, `cancellationPeriodUnit: contract.cancellationPeriod?.unit ?? 'MONTHS'` *(depends on T010 — ContractForm must accept these keys)*

**Checkpoint**: Run unit and integration tests — T011, T012, T013 assertions should pass. Test US2 manually using `quickstart.md` Scenario 7.

---

## Phase 5: User Story 3 — View Fields / Backwards Compatibility (Priority: P3)

**Goal**: Existing contracts (created before this feature) load and display without errors; new fields show as empty/not set. The service URL renders as a clickable link when populated.

**Independent Test**: Navigate to an existing contract's edit page → all four new fields appear empty with no layout errors. Then open a contract with a service URL set → confirm URL is a clickable link.

- [x] T015 [P] [TEST] [US3] Update `packages/frontend/tests/unit/contracts.service.test.ts`: extend every mock `ContractData` object to include `startDate: null`, `details: null`, `serviceUrl: null`, `cancellationPeriod: null`; confirm no TypeScript compile errors and mocks satisfy the updated `ContractData` type.
- [x] T016 [P] [TEST] [US3] Add a GET assertion to `packages/backend/tests/integration/contracts.route.test.ts`: create a contract without new fields (simulating a legacy record), call `GET /api/contracts`, assert the response includes `startDate: null`, `details: null`, `serviceUrl: null`, `cancellationPeriod: null` for that contract.

> **Note**: The clickable URL link (FR-007) and empty-field display (FR-008) are implemented in T010 (ContractForm). No additional implementation task is needed for US3 — the migration (T006) and nullable columns (T005) ensure backwards compatibility at the data layer.

**Checkpoint**: Run full test suite — all T015 and T016 assertions pass, all prior tests remain green. Test US3 manually using `quickstart.md` Scenario 5 and 6.

---

## Final Phase: E2E & Polish

**Purpose**: End-to-end coverage of the full create → view → edit lifecycle with new fields.

- [x] T017 [E2E] Extend `packages/frontend/tests/e2e/contracts.spec.ts` with three scenarios: (a) create a contract with `startDate`, `details`, `serviceUrl` (`https://example.com`), and `cancellationPeriod` (`30 Days`) → assert contract appears in the list; (b) navigate to edit for that contract → assert all four fields are pre-filled; save → assert no error; (c) enter `"bad-url"` in service URL field → attempt to save → assert validation error is visible and contract is not created/updated.
- [x] T018 Run all quickstart.md validation scenarios manually and confirm all 7 pass against the running dev environment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Start immediately — T001 and T002 can be written in parallel
- **Phase 3 (US1)**: Depends on full Phase 2 completion (T001–T007)
- **Phase 4 (US2)**: Depends on Phase 2 + T010 (ContractForm must accept new `defaultValues` keys)
- **Phase 5 (US3)**: Depends on Phase 2; T015 also depends on T003/T004 for the updated `ContractData` type
- **Final Phase**: Depends on Phases 3, 4, and 5 all complete

### Within-Phase Ordering

| Task | Depends On |
|------|-----------|
| T004 | T003 (imports `CancellationPeriodUnit`) |
| T006 | T005 (references new column names) |
| T007 | T004, T006 |
| T010 | T003, T004, T009 confirmed failing |
| T014 | T010 (ContractForm must accept the new keys) |

### Parallel Opportunities

Phase 2: T001 ‖ T002 ‖ T003 (then T004 after T003; then T005; then T006 after T005; then T007 after T004+T006)

Phase 3: T008 ‖ T009 (then T010 after T009 confirmed failing)

Phase 4: T011 ‖ T012 ‖ T013 (then T014 after T013 confirmed failing)

Phase 5: T015 ‖ T016

---

## Parallel Execution Examples

### Phase 2 — Foundational

```
# Start these three in parallel:
Task T001: "Update migration.test.ts with failing column assertions"
Task T002: "Extend contract.service.test.ts with failing new-field assertions"
Task T003: "Add CancellationPeriodUnit + extend Contract interface"

# After T003 completes:
Task T004: "Add CancellationPeriodSchema + extend Zod schemas"

# After T004+T005 complete:
Task T006: "Extend ContractRow + add migration block"

# After T006 complete:
Task T007: "Update ContractService (rowToContract, create, update)"
```

### Phase 3 — US1

```
# Start these two in parallel (write tests to fail):
Task T008: "Extend contracts.route.test.ts with POST new-field assertions"
Task T009: "Extend ContractForm.test.tsx with new-field assertions"

# After tests confirmed failing:
Task T010: "Extend ContractForm with four new fields + handleSubmit"
```

---

## Implementation Strategy

### MVP (Phase 2 + Phase 3 only)

1. Complete Foundational (T001–T007)
2. Complete US1 (T008–T010)
3. **STOP and validate**: run tests + manual quickstart Scenarios 1–3
4. The full create flow with all four new fields is functional

### Incremental Delivery

1. Foundational → all layers updated; API accepts new fields
2. US1 (ContractForm) → create flow complete
3. US2 (ContractEdit) → edit flow complete
4. US3 (backwards compat tests) → legacy contracts confirmed safe
5. E2E → full cycle tested end-to-end

---

## Notes

- `[P]` = touches a different file from concurrent tasks; safe to parallelise
- `[TEST]` tasks MUST produce failing tests before any implementation in that phase begins (Constitution Principle I)
- Commit after each checkpoint (phases are natural commit boundaries)
- `ContractNew.tsx` requires no changes — it already delegates entirely to `ContractForm`
- The `ContractTable.tsx` and dashboard components require no changes — new fields are not shown in the list view
- `UpdateContractBodySchema` is already `CreateContractBodySchema.partial()` — no extra schema code needed once `CreateContractBodySchema` is updated (T004)
