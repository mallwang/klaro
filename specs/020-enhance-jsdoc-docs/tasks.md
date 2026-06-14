# Tasks: Enhance Source Code JSDoc Documentation

**Input**: Design documents from `specs/020-enhance-jsdoc-docs/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [quickstart.md](quickstart.md)

**Tests**: Not applicable — this is a documentation-only feature with no production logic changes. Verification is via static grep checks and existing test suite pass/fail (see Phase 8).

**Organization**: Tasks are grouped by package layer, then by user story priority. US1 (file-level blocks) and US2 (function-level JSDoc) are applied together in a single pass per file. Tasks that only produce file-level blocks (schema/type files with no functions) are labeled [US1]; tasks that produce both file-level blocks and function JSDoc are labeled [US2].

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — all tasks within a phase operate on different files
- **[US1]**: Adds file-level JSDoc block only (schema/type files with no exported functions)
- **[US2]**: Adds both file-level JSDoc block AND function-level JSDoc (files with functions)
- **[US3]**: Verification that patterns are consistent enough for contributors to replicate

## JSDoc Patterns (from research.md)

- **Standard function**: one-sentence description + `@param name - description` per param + `@returns`
- **React components**: one-sentence description + `@param props.x - description`; omit `@returns`
- **Zod schema files**: file-level block only; individual `export const XSchema` constants get no JSDoc
- **Fastify route files**: file-level block + JSDoc on the exported registration function; inline anonymous handlers get no JSDoc

---

## Phase 1: Setup (Baseline Audit)

**Purpose**: Establish the current documentation coverage baseline before making any changes

- [ ] T001 Run baseline coverage grep and record which files lack a file-level JSDoc block: `grep -rL "^/\*\*" packages/backend/src packages/frontend/src packages/shared/src --include="*.ts" --include="*.tsx" | grep -v "vite-env\|types.d\|vite.config\|vitest.config\|playwright.config"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**N/A** — This feature adds documentation only. No new code infrastructure is required. All source files already exist; tasks below edit them in-place.

---

## Phase 3: User Story 1 — Shared Package File-Level Blocks (Priority: P1) 🎯

**Goal**: Every file in `packages/shared/src/` has a file-level JSDoc block. The shared package is documented first because both backend and frontend import from it — developers reading those imports will immediately encounter well-documented modules.

**Independent Test**: Run `grep -rL "^/\*\*" packages/shared/src --include="*.ts"` — must return zero files.

### Implementation for User Story 1

- [ ] T002 [P] [US1] Add file-level JSDoc blocks to `packages/shared/src/schemas/auth.ts` and `packages/shared/src/schemas/contract.ts`
- [ ] T003 [P] [US1] Add file-level JSDoc blocks to `packages/shared/src/schemas/dashboard.ts`, `packages/shared/src/schemas/invitation.ts`, `packages/shared/src/schemas/profile.ts`, and `packages/shared/src/schemas/user.ts`
- [ ] T004 [P] [US1] Add file-level JSDoc blocks to `packages/shared/src/types/contract.ts`, `packages/shared/src/types/invitation.ts`, and `packages/shared/src/types/user.ts`
- [ ] T005 [US1] Add file-level JSDoc block to `packages/shared/src/index.ts`

**Checkpoint**: All shared files have file-level blocks; `grep -rL "^/\*\*" packages/shared/src --include="*.ts"` returns zero lines.

---

## Phase 4: User Story 2 — Backend Service Documentation (Priority: P1)

**Goal**: Every backend service file has a file-level JSDoc block AND every exported function carries a complete JSDoc comment (one-sentence description, `@param` for each parameter, `@returns`).

**Independent Test**: Run `grep -rL "^/\*\*" packages/backend/src/services --include="*.ts"` — must return zero files. Open any service in VS Code and hover over an exported function to see its JSDoc tooltip.

### Implementation for User Story 2 — Backend Services

- [ ] T006 [P] [US2] Audit and complete JSDoc in `packages/backend/src/services/auth.service.ts` (file already has partial JSDoc — fill gaps in function descriptions and params)
- [ ] T007 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/services/contract.ts`
- [ ] T008 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/services/dashboard.ts`
- [ ] T009 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/services/invitation.service.ts`
- [ ] T010 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/services/mailer.service.ts`
- [ ] T011 [P] [US2] Audit and complete JSDoc in `packages/backend/src/services/password.ts` (file already has partial JSDoc — fill gaps)
- [ ] T012 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/services/profile.service.ts`
- [ ] T013 [P] [US2] Audit and complete JSDoc in `packages/backend/src/services/user.service.ts` (file already has partial JSDoc — fill gaps)

**Checkpoint**: `grep -rL "^/\*\*" packages/backend/src/services --include="*.ts"` returns zero lines.

---

## Phase 5: User Story 2 — Backend Routes, DB, and Entry (Priority: P1)

**Goal**: Every backend route file has a file-level block and a JSDoc comment on its exported registration function. Every DB and entry-point file has a file-level block and function JSDoc where applicable.

**Independent Test**: Run `grep -rL "^/\*\*" packages/backend/src --include="*.ts"` — must return zero files.

### Implementation for User Story 2 — Backend Routes

- [ ] T014 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/admin.ts`
- [ ] T015 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/auth.ts`
- [ ] T016 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/contracts.ts`
- [ ] T017 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/dashboard.ts`
- [ ] T018 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/invitations.ts`
- [ ] T019 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/profile.ts`
- [ ] T020 [P] [US2] Add file-level block and JSDoc on the exported registration function in `packages/backend/src/routes/users.ts`

### Implementation for User Story 2 — Backend DB Layer

- [ ] T021 [P] [US2] Audit and complete JSDoc in `packages/backend/src/db/client.ts` (file already has partial JSDoc — fill gaps, ensure file-level block present)
- [ ] T022 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/db/migrate.ts`
- [ ] T023 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/db/reset.ts`
- [ ] T024 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/backend/src/db/seed.ts`

### Implementation for User Story 2 — Backend Entry Points

- [ ] T025 [US2] Add file-level block and JSDoc on exported symbols in `packages/backend/src/server.ts`
- [ ] T026 [US2] Add file-level block to `packages/backend/src/index.ts` (application bootstrap entry point)

**Checkpoint**: `grep -rL "^/\*\*" packages/backend/src --include="*.ts"` returns zero lines.

---

## Phase 6: User Story 2 — Frontend Services and Hooks (Priority: P1)

**Goal**: Every frontend service file and custom hook has a file-level JSDoc block and function-level JSDoc on all exported functions/hooks.

**Independent Test**: Run `grep -rL "^/\*\*" packages/frontend/src/services packages/frontend/src/hooks --include="*.ts"` — must return zero files.

### Implementation for User Story 2 — Frontend Services

- [ ] T027 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/api.ts`
- [ ] T028 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/auth.ts`
- [ ] T029 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/contracts.ts`
- [ ] T030 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/export.ts`
- [ ] T031 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/importParsing.ts`
- [ ] T032 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/invitations.ts`
- [ ] T033 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/profile.ts`
- [ ] T034 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/services/users.ts`

### Implementation for User Story 2 — Frontend Hooks

- [ ] T035 [P] [US2] Add file-level block and hook JSDoc to `packages/frontend/src/hooks/useAccounts.ts`
- [ ] T036 [P] [US2] Add file-level block and hook JSDoc to `packages/frontend/src/hooks/useAnonymization.ts`
- [ ] T037 [P] [US2] Add file-level block and hook JSDoc to `packages/frontend/src/hooks/useAuth.ts`
- [ ] T038 [P] [US2] Add file-level block and hook JSDoc to `packages/frontend/src/hooks/useInvitations.ts`
- [ ] T039 [P] [US2] Add file-level block and hook JSDoc to `packages/frontend/src/hooks/useLocaleFormat.ts`

**Checkpoint**: `grep -rL "^/\*\*" packages/frontend/src/services packages/frontend/src/hooks --include="*.ts"` returns zero lines.

---

## Phase 7: User Story 2 — Frontend Components (Priority: P1)

**Goal**: Every React component file has a file-level block and a JSDoc comment on the exported component function. Note: component JSDoc omits `@returns` per the approved pattern in research.md.

**Independent Test**: Run `grep -rL "^/\*\*" packages/frontend/src/components --include="*.tsx"` — must return zero files.

### Implementation for User Story 2 — AppShell Components

- [ ] T040 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AppShell/AppShell.tsx`
- [ ] T041 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AppShell/FooterSimple.tsx`
- [ ] T042 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AppShell/LanguagePicker.tsx`
- [ ] T043 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AppShell/NavbarSegmented.tsx`
- [ ] T044 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AppShell/TopHeader.tsx`

### Implementation for User Story 2 — Feature Components

- [ ] T045 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/AnonymizationToggle.tsx`
- [ ] T046 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/CategoryIcon.tsx`
- [ ] T047 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ColumnMappingTable.tsx`
- [ ] T048 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ContractForm.tsx`
- [ ] T049 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ContractTable.tsx`
- [ ] T050 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/DeleteAccountModal.tsx`
- [ ] T051 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ExpiredContracts.tsx`
- [ ] T052 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ExportMenu.tsx`
- [ ] T053 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ImportResultSummary.tsx`
- [ ] T054 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/LanguageSwitcher.tsx`
- [ ] T055 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/ProviderLogo.tsx`
- [ ] T056 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/PublicLayout.tsx`
- [ ] T057 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/RequireAdmin.tsx`
- [ ] T058 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/RequireAuth.tsx`
- [ ] T059 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/SpendingOverview.tsx`
- [ ] T060 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/components/UpcomingRenewals.tsx`

**Checkpoint**: `grep -rL "^/\*\*" packages/frontend/src/components --include="*.tsx"` returns zero lines.

---

## Phase 8: User Story 2 — Frontend Pages and Utilities (Priority: P1)

**Goal**: All page components, utility modules, i18n configuration, and the application entry point have file-level blocks and function/component JSDoc.

**Independent Test**: Run `grep -rL "^/\*\*" packages/frontend/src --include="*.ts" --include="*.tsx" | grep -v "vite-env\|types.d"` — must return zero files.

### Implementation for User Story 2 — Pages

- [ ] T061 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/AcceptInvitation.tsx`
- [ ] T062 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/AccountSettings.tsx`
- [ ] T063 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/ContractEdit.tsx`
- [ ] T064 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/ContractImport.tsx`
- [ ] T065 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/ContractList.tsx`
- [ ] T066 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/ContractNew.tsx`
- [ ] T067 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/Dashboard.tsx`
- [ ] T068 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/EmailVerifyConfirm.tsx`
- [ ] T069 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/SignIn.tsx`
- [ ] T070 [P] [US2] Add file-level block and component JSDoc to `packages/frontend/src/pages/admin/AccountsAdmin.tsx`

### Implementation for User Story 2 — Utilities and Entry

- [ ] T071 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/utils/columnMapping.ts`
- [ ] T072 [P] [US2] Add file-level block and function JSDoc to all exported functions in `packages/frontend/src/lib/utils.ts`
- [ ] T073 [P] [US2] Add file-level block and JSDoc on any exported symbols in `packages/frontend/src/data/fantasyNames.ts`
- [ ] T074 [P] [US2] Add file-level block and JSDoc on exported functions/constants in `packages/frontend/src/i18n/index.ts`
- [ ] T075 [US2] Add file-level block to `packages/frontend/src/main.tsx` (application bootstrap; no exported symbols require function JSDoc)

**Checkpoint**: All frontend source files have JSDoc coverage. Run the full Phase 1 grep check — it must now return zero lines.

---

## Phase 9: User Story 3 — Verification and Pattern Consistency (Priority: P2)

**Goal**: Confirm 100% file-level coverage and zero forbidden phrases, verify TypeScript and lint integrity, and validate that the established patterns are consistent enough for contributors to replicate without additional guidance.

**Independent Test**: All four grep/lint/type-check commands below exit with zero errors.

### Implementation for User Story 3

- [ ] T076 [US3] Verify file-level JSDoc coverage: run `grep -rL "^/\*\*" packages/backend/src packages/frontend/src packages/shared/src --include="*.ts" --include="*.tsx" | grep -v "vite-env\|types.d\|vite.config\|vitest.config\|playwright.config"` — must produce no output (SC-001)
- [ ] T077 [US3] Verify no forbidden phrases in JSDoc: run `grep -rn "used by\|added for\|handles the case from\|issue #\|PR #\|ticket #" packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules` — must produce no output (SC-003)
- [ ] T078 [P] [US3] Run TypeScript strict-mode check across all packages: `pnpm --filter backend exec tsc --noEmit && pnpm --filter frontend exec tsc --noEmit && pnpm --filter @pcm/shared exec tsc --noEmit` — must exit zero (SC-005)
- [ ] T079 [P] [US3] Run ESLint across all packages: `pnpm lint` — must exit zero with no errors (SC-005)

**Checkpoint**: All verification checks pass. Pattern is established — any developer can open a documented file and replicate the JSDoc style on the next function they write.

---

## Phase 10: Polish and Cross-Cutting Concerns

**Purpose**: Final end-to-end validation to confirm no tests were broken by documentation edits

- [ ] T080 Run full test suite to confirm documentation edits introduced no regressions: `pnpm test`
- [ ] T081 [P] Perform manual IDE spot-check per quickstart.md Scenario 6: open `packages/backend/src/services/contract.ts`, `packages/frontend/src/hooks/useAuth.ts`, and `packages/frontend/src/components/ContractTable.tsx`; hover over an exported function in each file and confirm the IDE tooltip shows the JSDoc description and parameter documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — run immediately to establish baseline
- **Phase 2 (Foundational)**: N/A — skipped for this feature
- **Phase 3 (Shared / US1)**: Depends on Phase 1 baseline — document shared package first so backend and frontend developers encounter good examples when reading imports
- **Phase 4 (Backend Services / US2)**: Can start after Phase 3 (or in parallel with it — shared and backend edits are independent files)
- **Phase 5 (Backend Routes+DB / US2)**: Can start in parallel with Phase 4
- **Phase 6 (Frontend Services+Hooks / US2)**: Can start in parallel with Phases 4 and 5
- **Phase 7 (Frontend Components / US2)**: Can start in parallel with all prior phases
- **Phase 8 (Frontend Pages / US2)**: Can start in parallel with all prior phases
- **Phase 9 (Verification / US3)**: Depends on ALL Phase 3-8 tasks being complete
- **Phase 10 (Polish)**: Depends on Phase 9 passing

### User Story Dependencies

- **US1 (P1)**: Phases 3–8 together complete US1 (every file gets a file-level block)
- **US2 (P1)**: Phases 4–8 together complete US2 (every function file gets function JSDoc)
- **US3 (P2)**: Phase 9 completes US3 — depends on US1+US2 being done

### Within Each Phase

- All tasks in a phase marked [P] touch different files — they can be worked on fully in parallel
- Tasks without [P] (T001, T005, T025, T026, T075–T081) either touch shared state (grep commands) or have no parallel sibling

### Parallel Opportunities

All documentation tasks within a phase are fully parallel — each task operates on a distinct file with no shared state. All of T002–T074 can run in any order or concurrently (within their respective phases).

---

## Parallel Example: Phase 4 — Backend Services

```bash
# All 8 backend service files can be documented concurrently:
Task T006: packages/backend/src/services/auth.service.ts
Task T007: packages/backend/src/services/contract.ts
Task T008: packages/backend/src/services/dashboard.ts
Task T009: packages/backend/src/services/invitation.service.ts
Task T010: packages/backend/src/services/mailer.service.ts
Task T011: packages/backend/src/services/password.ts
Task T012: packages/backend/src/services/profile.service.ts
Task T013: packages/backend/src/services/user.service.ts
```

## Parallel Example: Phase 7 — Frontend Components

```bash
# All 21 component files can be documented concurrently:
Task T040–T044: AppShell sub-components
Task T045–T060: Feature components (AnonymizationToggle → UpcomingRenewals)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Backend Only)

1. Complete Phase 1: Setup (baseline audit)
2. Complete Phase 3: Shared package file-level blocks
3. Complete Phase 4: Backend service documentation
4. Complete Phase 5: Backend routes + DB documentation
5. **STOP and VALIDATE**: Run Phase 9 checks scoped to backend — verify backend coverage is 100%
6. Backend is fully documented; frontend can follow in a subsequent pass

### Incremental Delivery

1. Phase 1 → establish baseline
2. Phase 3 → shared package (US1, small surface area)
3. Phases 4–5 → backend documentation (US2, highest value)
4. Phases 6–8 → frontend documentation (US2, largest file count)
5. Phase 9 → full verification (US3)
6. Phase 10 → test suite confirms no regressions

### Parallel Team Strategy

With multiple developers:

1. Phase 3 (Shared) — one developer, completes quickly
2. Once Phase 3 is done, all remaining phases can be split:
   - Developer A: Phases 4–5 (backend)
   - Developer B: Phases 6–7 (frontend services, hooks, components)
   - Developer C: Phase 8 (pages + utilities)
3. All reconvene for Phase 9–10 verification

---

## Notes

- **[P] tasks** operate on distinct files — zero shared-state conflicts
- **[US1]** = file-level block only (schema/type files); **[US2]** = file-level block + function JSDoc (applied in one pass)
- **[US3]** = verification checks, not file edits
- Partially documented files (T006, T011, T013, T021): audit existing JSDoc first, fill gaps only — do not replace correct existing comments
- Commit after each phase (or after each logical group of files within a phase)
- If a grep check in Phase 9 reveals missed files, loop back to the appropriate phase before proceeding to Phase 10
- Research.md §4 covers the React component `@returns` exemption — do not add `@returns JSX.Element` to component functions
- Research.md §5 covers Zod schema constants — no function JSDoc needed on `export const XSchema = z.object(...)`
- Research.md §6 covers Fastify route files — JSDoc on the registration function only, not on inline anonymous handlers
