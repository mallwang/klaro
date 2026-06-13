# Implementation Plan: Global App Shell with Top-Level Header and Footer

**Branch**: `016-global-app-shell` | **Date**: 2026-06-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/016-global-app-shell/spec.md`

## Summary

Refactor the authenticated application layout to add a persistent top-level header (showing the app icon placeholder, app name, language picker, and theme toggle) and anchor the existing footer using Mantine's dedicated Footer slot. The language picker and theme toggle are relocated from the left sidebar into the new header. No new backend changes, API endpoints, or data storage is required.

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3, Node.js LTS (ESM)

**Primary Dependencies**: Mantine v7.17, @tabler/icons-react v3.34, react-i18next v17, react-router-dom v7, Vitest v4, @testing-library/react v16

**Storage**: N/A — color scheme persisted via existing `localStorageColorSchemeManager` (`pcm-color-scheme` key); language persisted via existing `localStorage.setItem('pcm-lang')`.

**Testing**: Vitest + @testing-library/react for unit tests; Playwright for E2E (existing suite, no new E2E tests required for this feature)

**Target Platform**: Browser (desktop + mobile responsive)

**Project Type**: Web application (frontend-only change)

**Performance Goals**: No new performance requirements. Header and footer are static layout elements with negligible render cost.

**Constraints**: Must not introduce new dependencies. Must not break existing unit or E2E tests. TypeScript strict mode must remain satisfied.

**Scale/Scope**: Single frontend package (`packages/frontend`). Affects 2 existing components (modified) and 1 new component.

## Constitution Check

### Principle I: Test-First (NON-NEGOTIABLE)

**PASS** — Plan mandates failing tests in `AppShell.test.tsx` be written and confirmed failing before any component changes are made. All new behavior (header renders app name, header renders language picker, header renders theme toggle, sidebar no longer contains language picker / theme toggle) must have a corresponding failing test before implementation.

### Principle II: Type Safety (NON-NEGOTIABLE)

**PASS** — No new `any` types introduced. `TopHeader` props are typed (receives `mobileOpened: boolean` and `toggleMobile: () => void` from parent). All imports use explicit types. `tsc --noEmit` must pass before the branch is merged.

### Principle III: Simplicity (YAGNI)

**PASS** — No new abstractions beyond what the feature requires. `TopHeader` is a single new component. The Mantine header and footer slots are used directly without additional wrapper layers. No new utilities or hooks are introduced.

## Project Structure

### Documentation (this feature)

```text
specs/016-global-app-shell/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   └── components/
│       └── AppShell/
│           ├── AppShell.tsx              # modified — adds header/footer slots, composes TopHeader
│           ├── AppShell.module.css       # modified — remove/adjust header-specific styles
│           ├── TopHeader.tsx             # NEW — app icon, name, language picker, theme toggle
│           ├── TopHeader.module.css      # NEW — header layout styles
│           ├── NavbarSegmented.tsx       # modified — remove settingsSection (lang picker + theme toggle)
│           ├── NavbarSegmented.module.css  # modified — remove .settingsSection styles
│           ├── FooterSimple.tsx          # unchanged content (may remove margin-top: auto from CSS)
│           └── FooterSimple.module.css   # minor — remove margin-top: auto if no longer needed
└── tests/
    └── unit/
        └── AppShell.test.tsx             # modified — add failing tests for new header behavior
```

## Implementation Tasks

### Task 1 — Write Failing Tests (TDD: RED)

Extend `packages/frontend/tests/unit/AppShell.test.tsx` with assertions for the new header behavior. Run tests and confirm they fail before writing any component code.

**New assertions to add**:
- Header renders the application name "Personal Contract Management"
- Header renders the language picker (query by role or known text)
- Header renders the theme toggle button
- Sidebar does NOT render the language picker
- Sidebar does NOT render the theme toggle button

**Verification**: `pnpm test` shows the new assertions as failing.

---

### Task 2 — Create TopHeader Component

Create `packages/frontend/src/components/AppShell/TopHeader.tsx`:

- Left section: `ThemeIcon` (or `ActionIcon` variant) with a tabler icon (e.g., `IconFileDescription`) + `Text` "Personal Contract Management"
- Right section: `LanguagePicker` component + theme toggle `ActionIcon` (same logic currently in NavbarSegmented)
- Props: `mobileOpened: boolean`, `toggleMobile: () => void` — burger button shown `hiddenFrom="sm"` in left section
- Imports: `LanguagePicker` from `./LanguagePicker.js`, `useMantineColorScheme` from `@mantine/core`, icons from `@tabler/icons-react`

Create `packages/frontend/src/components/AppShell/TopHeader.module.css`:
- `.header`: `display: flex; align-items: center; justify-content: space-between; padding: 0 var(--mantine-spacing-md); height: 100%;`
- `.left`: `display: flex; align-items: center; gap: var(--mantine-spacing-sm);`
- `.right`: `display: flex; align-items: center; gap: var(--mantine-spacing-sm);`

---

### Task 3 — Update AppShell.tsx

Modify `packages/frontend/src/components/AppShell/AppShell.tsx`:

1. Add `header: { height: 60 }` and `footer: { height: 50 }` to the `MantineAppShell` props (alongside existing `navbar` prop).
2. Replace the mobile-only `MantineAppShell.Header` (with burger) with a full `MantineAppShell.Header` rendering `TopHeader` — pass `mobileOpened` and `toggleMobile` as props.
3. Remove `FooterSimple` from inside `MantineAppShell.Main`.
4. Add `MantineAppShell.Footer` below `MantineAppShell.Main` rendering `FooterSimple`.

---

### Task 4 — Update NavbarSegmented.tsx

Modify `packages/frontend/src/components/AppShell/NavbarSegmented.tsx`:

1. Remove the `settingsSection` div and its children (`LanguagePicker`, theme toggle `ActionIcon`, `Tooltip`).
2. Remove now-unused imports: `LanguagePicker`, `useMantineColorScheme`, `IconSun`, `IconMoon`, `Tooltip`.

---

### Task 5 — Clean Up CSS

- `NavbarSegmented.module.css`: remove `.settingsSection` block.
- `FooterSimple.module.css`: remove `margin-top: auto` from `.footer` (no longer needed inside a flex Main; Mantine Footer slot handles placement).
- `AppShell.module.css`: remove or adjust `.header` styles if the mobile burger header class is no longer used.

---

### Task 6 — Verify Tests Pass (TDD: GREEN)

Run `pnpm test` in `packages/frontend`. All tests including the new assertions from Task 1 must pass.

---

### Task 7 — Type Check and Lint

```bash
cd packages/frontend
pnpm tsc --noEmit
pnpm lint
```

Both must exit with zero errors.

---

### Task 8 — Manual Validation

Follow the scenarios in [quickstart.md](quickstart.md) to confirm visual correctness across pages, viewport sizes, and both color schemes.
