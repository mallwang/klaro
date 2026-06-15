# Research: Compact Contract Form Layout

**Feature**: 026-compact-contract-form
**Date**: 2026-06-15

## Decisions

### Grid Implementation Strategy

**Decision**: Use CSS Grid via the existing CSS Module pattern (`ContractForm.module.css`)
**Rationale**: Already used in the project (`dateGrid` class). Zero new dependencies, consistent with existing code.
**Alternatives considered**: Mantine `<SimpleGrid>` component — adds JSX nesting without benefit over CSS Modules already in place.

### Shared Two-Column Class

**Decision**: One `.twoColumnRow` class for both the name+category and amount+interval rows.
**Rationale**: Identical grid definition; sharing one class is simpler than duplicating it under two names (YAGNI).
**Alternatives considered**: Separate per-row classes — rejected as pure duplication.

### Responsive Breakpoint

**Decision**: Collapse multi-column rows to single column at `max-width: 48em` (768 px, Mantine `sm`)
**Rationale**: The form container is capped at 600 px max-width. The three-column status+date row becomes too narrow to be usable between 576–768 px, so collapsing at `sm` is the safe choice.
**Alternatives considered**: `xs` (576 px) — too narrow; leaves cramped three-column layout on mid-size tablets.

### Cancellation Period Half-Width

**Decision**: Wrap existing `cancellationRow` div with a `cancellationHalf` container (`max-width: 50%`)
**Rationale**: Minimal change — inner flex layout is already correct, just needs a width constraint on the outer wrapper.
**Alternatives considered**: Place cancellation inside a two-column grid with a dummy empty cell — rejected as invisible markup pollution.

### Removal of `.dateGrid`

**Decision**: Remove the existing `.dateGrid` CSS class; replace with `.statusDateRow` (three columns: status + start + end)
**Rationale**: Adding status to the date row requires a new three-column grid; keeping `.dateGrid` as an unused class would be dead code.
**Alternatives considered**: Keep `.dateGrid` and nest status outside — rejected because it defeats the goal of a single unified row for all three fields.
