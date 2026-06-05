# Research: Sortable Contract Table Columns

## Sort State Management

**Decision**: Manage sort state as a single `{ column, direction }` pair in a `useState` hook inside `ContractTable`.

**Rationale**: Sort is view-only (client-side, not persisted). A single state value is the simplest representation and avoids unnecessary abstraction. No external state manager or URL param is needed.

**Alternatives considered**:
- URL search params — rejected; spec says no persistence across reloads and this adds complexity for a personal tool.
- Custom hook — rejected; the logic fits cleanly inline, and a dedicated hook would be a premature abstraction (constitution Principle III).

---

## Sort Direction Cycle

**Decision**: Three-state cycle: `'asc' → 'desc' → null` (unsorted). Clicking the active column's header advances the cycle; clicking a different header resets to `'asc'`.

**Rationale**: Matches the spec acceptance scenario (click 1 = asc, click 2 = desc, click 3 = back to default) and is consistent with most data table conventions.

**Alternatives considered**:
- Two-state toggle (asc/desc only) — rejected; spec explicitly requires an unsorted state to restore default order.

---

## Amount Column Comparator

**Decision**: Sort by `contract.amount` (a `number`) directly. Billing interval is ignored.

**Rationale**: Spec requirement FR-004 is explicit. `amount` is already typed as `number` in `ContractData`, so a simple numeric comparison suffices with no parsing.

---

## Null End Date Handling

**Decision**: When sorting by end date, treat `null` as the far future (`'9999-99-99'`) for comparison purposes, placing null-date rows last (ascending) and first (descending).

**Rationale**: String ISO-date comparison works lexicographically for `YYYY-MM-DD`. Substituting a sentinel value keeps the comparator simple without a special-case branch per row pair.

---

## Sort Stability

**Decision**: Use JavaScript's native `Array.prototype.sort`, which is guaranteed stable in all modern engines (V8/SpiderMonkey/JavaScriptCore) since ES2019 and in Node.js ≥ 11.

**Rationale**: No custom stable-sort wrapper is needed. The spec requires stable sort; the native implementation delivers it.

---

## Visual Sort Indicators

**Decision**: Use `lucide-react` icons already in the dependency tree: `ChevronUp` (ascending), `ChevronDown` (descending), `ChevronsUpDown` (unsorted/neutral). Render inline next to the column header text.

**Rationale**: `lucide-react` is already installed (`^1.17.0` in `package.json`). Reaching for it avoids adding a new dependency, is consistent with the project's UI tooling, and provides universally recognisable sort icons.

**Alternatives considered**:
- CSS-only arrows via `::after` pseudo-elements — rejected; harder to test and requires extra CSS authoring.
- Importing a separate icon library — rejected; `lucide-react` already covers the need.

---

## Scope Boundary

**Decision**: Changes are confined to `packages/frontend/src/components/ContractTable.tsx` (component logic + markup) and its test file `packages/frontend/tests/unit/ContractTable.test.tsx`. No backend, shared, or other frontend files require modification.

**Rationale**: Sort is purely a presentation-layer concern on already-loaded data. No schema, API contract, or translation key changes are needed beyond adding sort-button accessible labels (which live in the component, not in i18n files, given their simple inline nature).

---

## i18n Consideration

**Decision**: Sort-direction aria-labels (`Sort ascending`, `Sort descending`, `Clear sort`) are not added to the i18n translation files for this feature. The existing `t('contractList.*')` keys for column headers are reused as-is.

**Rationale**: The table is a personal tool. Aria-labels can be plain English strings embedded in the component. Adding translation keys for internal ARIA text would be over-engineering at this scale (constitution Principle III).
