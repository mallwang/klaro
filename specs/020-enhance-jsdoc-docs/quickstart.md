# Quickstart Validation Guide: Enhance Source Code JSDoc Documentation

**Feature**: `020-enhance-jsdoc-docs` | **Date**: 2026-06-14

This guide describes how to verify that JSDoc documentation has been correctly added across
all source files. No runtime environment is required — all checks are static.

## Prerequisites

- Node.js LTS and pnpm installed
- Repository cloned and dependencies installed: `pnpm install`
- On branch `020-enhance-jsdoc-docs`

## Verification Scenarios

### Scenario 1 — File-Level JSDoc Coverage (SC-001)

Verify that every non-exempt source file has a file-level JSDoc block.

```bash
# Should return ZERO files after implementation is complete.
# Any file listed still needs a file-level block.
grep -rL "^/\*\*" \
  packages/backend/src \
  packages/frontend/src \
  packages/shared/src \
  --include="*.ts" --include="*.tsx" \
  | grep -v "vite-env.d.ts\|types.d.ts\|vite.config\|vitest.config\|playwright.config"
```

**Expected outcome**: No output (zero files missing a JSDoc block).

---

### Scenario 2 — No Forbidden Phrases in JSDoc (SC-003)

Verify that no JSDoc block references callers, tasks, or issue/PR numbers.

```bash
# Should return ZERO matches.
grep -rn \
  "used by\|added for\|handles the case from\|issue #\|PR #\|ticket #" \
  packages/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|dist"
```

**Expected outcome**: No output.

---

### Scenario 3 — TypeScript Strict-Mode Passes (SC-005)

Verify that adding JSDoc comments has not introduced any TypeScript errors.

```bash
# Run from repo root — checks all three packages.
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter @pcm/shared exec tsc --noEmit
```

**Expected outcome**: No errors, no warnings.

---

### Scenario 4 — ESLint Passes (SC-005)

Verify that no JSDoc comment accidentally introduced a lint violation.

```bash
pnpm lint
```

**Expected outcome**: Zero lint errors.

---

### Scenario 5 — All Tests Still Pass (SC-005)

Verify that documentation-only edits have not broken any existing test.

```bash
pnpm test
```

**Expected outcome**: All Vitest unit/integration tests green; zero test failures.

---

### Scenario 6 — Manual Spot-Check (SC-004)

Open any of the following files and verify the file-level block describes the module's
role in one or two plain sentences:

- `packages/backend/src/services/contract.ts`
- `packages/backend/src/routes/contracts.ts`
- `packages/frontend/src/hooks/useAuth.ts`
- `packages/frontend/src/components/ContractTable.tsx`
- `packages/shared/src/schemas/contract.ts`

Then hover over any exported function in VS Code and confirm the IDE tooltip shows the
JSDoc description and parameter documentation.

**Expected outcome**: A developer can read the file-level block and immediately understand
the module's role without reading any implementation code.

---

## Quick Reference: Required JSDoc Structure

See [research.md](research.md) for the approved patterns per file category (services,
routes, React components, Zod schemas).

### Standard function

```ts
/**
 * Creates a new contract for the authenticated user and returns its assigned ID.
 *
 * @param db - Active database connection
 * @param userId - ID of the user who owns the contract
 * @param data - Validated contract payload from the request body
 * @returns The newly created contract's UUID
 */
export function createContract(db: Database, userId: string, data: CreateContractBody): string {
```

### React component (no `@returns`)

```ts
/**
 * Renders the contract list with sortable columns and per-row anonymization support.
 *
 * @param props.contracts - Array of contracts to display
 * @param props.onEdit - Callback invoked when the user clicks the edit action for a row
 */
export function ContractTable({ contracts, onEdit }: ContractTableProps) {
```

### File-level block (placed after imports, before first export)

```ts
import { ... } from '...';

/**
 * Service layer for contract CRUD operations against the SQLite database.
 */
export class ContractService {
```
