# Research: Global App Shell with Top-Level Header and Footer

**Feature**: 016-global-app-shell
**Date**: 2026-06-14

## Decision Log

### 1. Mantine AppShell Header Slot

**Decision**: Use `MantineAppShell.Header` as the top-level persistent header across all viewport sizes, with `height` set in the `header` prop of `MantineAppShell`.

**Rationale**: The existing `AppShell.tsx` already uses `MantineAppShell` as the layout root. Its `header` prop reserves a fixed-height slot at the top that automatically adjusts `Main` padding. The current code uses `MantineAppShell.Header` with `hiddenFrom="sm"` only for the mobile burger menu; the new design promotes it to an always-visible header and removes the `hiddenFrom` restriction.

**Alternatives considered**:
- Absolute/fixed CSS positioning: rejected — Mantine AppShell handles layout slots natively; manual positioning fights the framework and breaks on mobile.
- Separate HTML `header` element outside MantineAppShell: rejected — loses the automatic padding compensation Mantine provides for header height.

---

### 2. App Icon Placeholder

**Decision**: Use Mantine `ThemeIcon` with a document/contract icon from `@tabler/icons-react` as the app icon placeholder. Render it alongside the app name text in the header left section.

**Rationale**: `@tabler/icons-react` is already a project dependency. `ThemeIcon` is a Mantine primitive that produces a consistently styled icon container. No new dependencies required. A real SVG or image icon can replace it later with zero structural change.

**Alternatives considered**:
- A colored `Avatar` with initials "PCM": viable but `ThemeIcon` communicates "icon" more clearly.
- An `img` placeholder with a broken src: rejected — produces a broken image indicator in the UI.

---

### 3. Footer Anchoring Strategy

**Decision**: Move `FooterSimple` from inside `MantineAppShell.Main` into `MantineAppShell.Footer` (using the `footer: { height: N }` prop on the shell).

**Rationale**: `MantineAppShell.Footer` is the idiomatic Mantine approach — it ensures the footer is always at the bottom of the viewport and `Main` receives automatic bottom padding so content is never obscured. The current approach (CSS `margin-top: auto` inside Main) works but is non-idiomatic and requires manual height management.

**Alternatives considered**:
- Keep footer inside Main with existing flex trick: works but fights Mantine's layout model once a proper header slot is added.
- `position: fixed; bottom: 0`: rejected — obscures content without automatic padding compensation.

---

### 4. Language Picker and Theme Toggle Relocation

**Decision**: Move `LanguagePicker` and the theme toggle `ActionIcon` from `NavbarSegmented`'s settings section into the new `TopHeader` component. Remove the `settingsSection` div and its CSS class from `NavbarSegmented`.

**Rationale**: These are global app controls, not navigation items. Placing them in the header aligns with standard UI conventions and eliminates the dedicated settings section in the sidebar that exists solely for these two controls.

**Alternatives considered**:
- Keeping controls in both sidebar and header: rejected — duplication creates confusion and is explicitly out of scope per spec.
- Moving to a user menu dropdown in the header: rejected — adds interaction complexity; the spec calls for visible controls in the header.

---

### 5. Component Boundaries

**Decision**: Create a new `TopHeader` component at `packages/frontend/src/components/AppShell/TopHeader.tsx` with accompanying `TopHeader.module.css`. `AppShell.tsx` imports and renders it inside `MantineAppShell.Header`. `FooterSimple` moves from inside `Main` to `MantineAppShell.Footer`.

**Rationale**: Consistent with the existing pattern where each visual section is its own component (`NavbarSegmented`, `FooterSimple`). `AppShell.tsx` remains the composition root.

**Alternatives considered**:
- Inlining header JSX inside `AppShell.tsx`: rejected — violates the established component-per-section pattern.

---

### 6. Test Strategy

**Decision**: Extend the existing `AppShell.test.tsx` with new assertions: app name text in the header, language picker present in the header, theme toggle button in the header, and absence of language picker / theme toggle in the sidebar. Update or supplement footer assertions as needed.

**Rationale**: The existing test already renders the full `AppShell` with all providers. Adding assertions to the same file keeps tests co-located with the component under test. Per the TDD constitution, failing tests must be written before any implementation code.

**Alternatives considered**:
- Separate `TopHeader.test.tsx`: viable but would require duplicating the full provider wrapper setup; extending the existing file is simpler and sufficient.
