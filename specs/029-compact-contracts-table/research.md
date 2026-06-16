# Research: Compact Contracts Table

**Branch**: `029-compact-contracts-table` | **Date**: 2026-06-16

## Decision 1: CSS approach for single-line truncation in a Mantine Table cell

**Decision**: Use `overflow: hidden; min-width: 0` on the `.nameCell` flex wrapper, and wrap the name text in a Mantine `<Text truncate="end">` component.

**Rationale**: Inside a CSS flex container, children do not shrink below their `min-content` size by default, so `text-overflow: ellipsis` alone has no effect. Setting `min-width: 0` on the flex container allows it to shrink, and Mantine's `truncate` prop applies `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on the `<Text>` element. This is the idiomatic Mantine approach and avoids raw CSS duplication.

**Alternatives considered**:
- `max-width: Xpx` on the nameCell: rejected because it requires a hardcoded pixel value that breaks at different viewport sizes and on different column width distributions.
- Pure CSS `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` on the TD: rejected because Mantine Table TDs have no custom class attached; adding `styles` inline per cell would scatter visual logic and conflict with the existing CSS-module approach.

## Decision 2: Button-as-router-link for the Edit action

**Decision**: Replace the `<Anchor component={Link} to={...}>` with `<Button size="compact-sm" variant="default" component={Link} to={...}>`.

**Rationale**: Mantine's `Button` is a polymorphic component that accepts a `component` prop. Passing `component={Link}` (React Router's `Link`) renders a `<a>` element in the DOM with full router navigation, while retaining all Mantine Button styling. This is the same pattern used elsewhere in the project (e.g., the Dashboard "Manage Contracts" button). No additional imports are needed beyond what is already in scope.

**Alternatives considered**:
- Keep `Anchor` but restyle it to look like a button: rejected — `Anchor` is intentionally minimal and has no `variant="default"` prop; achieving button-like styling on an Anchor requires fighting Mantine's reset styles.
- Use `useNavigate` + a plain `<Button onClick>`: rejected — adds imperative navigation logic where declarative routing suffices.

## Decision 3: Row vertical spacing

**Decision**: Add `verticalSpacing="xs"` to the `<Table>` component in `ContractTable.tsx`.

**Rationale**: Mantine v7's Table `verticalSpacing` defaults to `"md"` (12px top+bottom per cell). Reducing to `"xs"` (4px) visually matches the density seen in the Manage Accounts table (which also doesn't specify verticalSpacing, but has less content per cell, making rows appear tighter). If visual testing shows `"xs"` is too tight, `"sm"` (8px) is the fallback.

**Alternatives considered**:
- Reducing padding with custom CSS: rejected — using the built-in Mantine prop keeps the change one line and respects the design-token system.
- No change to verticalSpacing: acceptable fallback if the name-truncation fix alone achieves the desired density, but trying `"xs"` first matches the spirit of the user's request.

## Decision 4: Delete button style alignment

**Decision**: Change the Delete button (default state) from `variant="subtle" color="red"` to `variant="default"` (no explicit color), matching Manage Accounts neutral actions. The confirmation Confirm button keeps `variant="filled" color="red"`.

**Rationale**: In Manage Accounts, destructive actions that require a further confirmation step use `variant="default"` for the initial trigger (Archive, Cancel Invite) and `variant="filled" color="red"` only for the explicit confirm step. This two-stage pattern reduces accidental-click risk. Applying the same pattern to the contracts table Delete button aligns visual grammar across the two tables.

**Alternatives considered**:
- `variant="default" color="red"`: would render a red-tinted default button — present in Mantine's invitations table for "Cancel Invite", but not used in the accounts table for the initial archive/delete trigger. Sticking with `variant="default"` (no color) is more consistent with the majority of Manage Accounts action buttons.
