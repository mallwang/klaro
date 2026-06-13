# Data Model: Global App Shell with Top-Level Header and Footer

**Feature**: 016-global-app-shell
**Date**: 2026-06-14

## Overview

This feature is a pure UI layout change — no new data entities, database tables, or API contracts are introduced. The data model section documents the UI component model: how the layout is structured, what state each component owns, and how existing state (color scheme, language) is consumed.

---

## UI Component Model

### TopHeader (new)

Renders the persistent application header bar.

| Concern | Detail |
|---------|--------|
| **Location** | `packages/frontend/src/components/AppShell/TopHeader.tsx` |
| **Owns state** | None — reads from Mantine color scheme context and i18n context |
| **Left section** | App icon placeholder (`ThemeIcon` + icon from tabler) + app name text ("Personal Contract Management") |
| **Right section** | `LanguagePicker` component + theme toggle `ActionIcon` |
| **Props** | None (all state from context) |

---

### AppShell (modified)

The composition root for the authenticated layout.

| Concern | Detail |
|---------|--------|
| **Location** | `packages/frontend/src/components/AppShell/AppShell.tsx` |
| **Change** | Adds `header: { height: 60 }` and `footer: { height: 50 }` props to `MantineAppShell`. Renders `TopHeader` inside `MantineAppShell.Header`. Moves `FooterSimple` from inside `Main` to `MantineAppShell.Footer`. Removes mobile-only `MantineAppShell.Header` with burger. |
| **Mobile burger** | Relocated inside `TopHeader` left section (shown only below `sm` breakpoint via `visibleFrom`/`hiddenFrom`) |

---

### NavbarSegmented (modified)

The left sidebar navigation.

| Concern | Detail |
|---------|--------|
| **Location** | `packages/frontend/src/components/AppShell/NavbarSegmented.tsx` |
| **Change** | Remove `settingsSection` div containing `LanguagePicker` and theme toggle `ActionIcon`. Remove associated imports (`LanguagePicker`, `useMantineColorScheme`, `IconSun`, `IconMoon`, `Tooltip`). Retain: nav links, segment control (admin only), user section (display name + sign out). |

---

### FooterSimple (unchanged content, relocated)

| Concern | Detail |
|---------|--------|
| **Location** | `packages/frontend/src/components/AppShell/FooterSimple.tsx` |
| **Change** | No JSX or logic changes. Rendered by `MantineAppShell.Footer` instead of inside `Main`. CSS file may need minor adjustments — the `margin-top: auto` trick is no longer needed since Mantine handles footer placement. |

---

## State Flow

| State | Owner | Consumed by |
|-------|-------|-------------|
| Color scheme (light/dark) | Mantine `MantineProvider` + `localStorageColorSchemeManager` | `TopHeader` (theme toggle reads + writes via `useMantineColorScheme`) |
| Language | i18next | `TopHeader` via `LanguagePicker` (reads `i18n.language`, writes via `i18n.changeLanguage`) |
| Mobile nav open/closed | `AppShell` local state (`useDisclosure`) | `TopHeader` (receives `mobileOpened` + `toggleMobile` as props) |
| Current user | React Query cache via `useCurrentUser` | `NavbarSegmented` (display name, role for admin segment) |

---

## No New Persistent Data

- No new API endpoints
- No new database fields
- No new localStorage keys (existing `pcm-color-scheme` and `pcm-lang` keys are reused)
