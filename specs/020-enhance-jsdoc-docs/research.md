# Research: Enhance Source Code JSDoc Documentation

**Feature**: `020-enhance-jsdoc-docs` | **Date**: 2026-06-14

## 1. File Audit and Current Coverage

**Decision**: 88 non-test source files require JSDoc; 5 already have partial coverage.

**Rationale**: Counted via `find` + `grep` across `packages/` excluding `node_modules`,
`dist`, `.test.ts`, `.spec.ts`, `.test.tsx`. The 5 partial files still need to be audited
for completeness (function-level gaps may exist even where a file-level block is present).

**Already partially documented** (audit required for completeness):
- `packages/backend/src/services/auth.service.ts` — has file-level block and some function JSDoc
- `packages/backend/src/services/password.ts` — has some JSDoc
- `packages/backend/src/db/client.ts` — has some JSDoc
- `packages/backend/src/services/user.service.ts` — has some JSDoc
- `packages/backend/tests/helpers/auth.ts` — test helper, function JSDoc needed if exported

**Alternatives considered**: Running an automated JSDoc linter (eslint-plugin-jsdoc) to
enforce coverage going forward. Deferred — adding a linter is a separate infrastructure
concern and out of scope for this feature (per Principle III).

---

## 2. File Scope and Exclusions

**Decision**: Audit and update all 88 `.ts`/`.tsx` source files; exclude the following:

| Category | Excluded files | Reason |
|---|---|---|
| Type declarations | `packages/frontend/src/i18n/types.d.ts`, `packages/frontend/src/vite-env.d.ts` | Declaration-only, no functions to document |
| Config files | `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` | Tool configuration, not application code |
| Test files | `*.test.ts`, `*.spec.ts`, `*.test.tsx`, `tests/setup.ts`, `tests/e2e/auth.setup.ts` | Exempt per FR-009 |
| Generated/vendored | None identified | No generated files in `src/` |

**Effective target**: ~80 files after exclusions.

**Rationale**: Config and declaration files do not contain exported application functions.
Including them would add noise without adding developer value.

---

## 3. Priority Order for Implementation

**Decision**: Process files in this order to deliver value incrementally and catch issues early.

| Priority | Package | Directory | Why |
|---|---|---|---|
| P1 | `backend` | `services/` | Core business logic; most referenced by other developers |
| P1 | `backend` | `routes/` | API entry points; second most referenced |
| P2 | `backend` | `db/` | Infrastructure layer; referenced by services |
| P2 | `backend` | `index.ts`, `server.ts` | Application entry points |
| P3 | `shared` | `schemas/`, `types/`, `index.ts` | Contract layer shared by both packages |
| P4 | `frontend` | `services/` | API client layer; frequently modified |
| P4 | `frontend` | `hooks/` | Custom React hooks; called throughout components |
| P5 | `frontend` | `utils/`, `lib/`, `data/`, `i18n/` | Utility modules |
| P6 | `frontend` | `components/` | UI components; largest file count |
| P7 | `frontend` | `pages/` | Page-level components; mostly orchestration |
| P7 | `frontend` | `main.tsx` | Application bootstrap |

**Rationale**: Backend services are the highest-value documentation targets because they
contain the most complex logic and are the most likely to be misread. Frontend pages are
last because their purpose is usually self-evident from their name and route context.

---

## 4. JSDoc Pattern for React Components

**Decision**: React component files get a file-level block describing the component's role.
The component function itself gets a one-sentence `@param props` entry if it accepts props;
omit `@returns` (all components return JSX, which is self-evident).

**Rationale**: The constitution requires `@returns` for all functions, but for React
components returning JSX the return value is structurally implied. A `@returns JSX.Element`
adds no information. This is the only approved deviation from the standard JSDoc structure,
and it applies exclusively to React component functions.

**Example**:
```ts
/**
 * Displays the contract list with sortable columns and anonymization support.
 */
export function ContractTable({ contracts, onEdit }: ContractTableProps) {
```

---

## 5. JSDoc Pattern for Zod Schema Files

**Decision**: Shared schema files (e.g., `schemas/contract.ts`) get a file-level block.
Individual Zod schema constants (`export const XSchema = z.object(...)`) do not require
function-level JSDoc since they are values, not functions.

**Rationale**: Zod schemas are constant declarations, not functions. The project guidelines
specify JSDoc for functions; schema values are self-describing through their Zod definition
and TypeScript type. A file-level block covers the module's overall purpose.

---

## 6. JSDoc Pattern for Route Files

**Decision**: Each Fastify route registration function gets a file-level block for the file
and a one-sentence JSDoc on the exported registration function. Individual route handlers
defined inline (anonymous arrow functions) do not receive their own JSDoc; the route path
and HTTP method make their purpose clear.

**Rationale**: Inline anonymous route handlers registered directly with `fastify.get(...)` 
etc. are local to the registration function and their identity is fully captured by the
HTTP method + path. Adding JSDoc to each one would duplicate what the route declaration
already expresses, violating FR-007.

---

## 7. Verification Approach

**Decision**: Coverage is verified by grep after implementation, with two checks:

1. **File-level block**: `grep -rL "^/\*\*" packages/backend/src packages/frontend/src packages/shared/src --include="*.ts" --include="*.tsx"` — should return zero files (after exclusions).
2. **Forbidden phrases**: `grep -rn "used by\|added for\|handles the case from\|issue #\|PR #" packages/ --include="*.ts" --include="*.tsx"` — should return zero matches in JSDoc blocks.

**Rationale**: These grep commands map directly to SC-001 and SC-003 from the spec. They
are fast, repeatable, and require no additional tooling.
