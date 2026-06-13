# Quickstart Validation Guide: Global App Shell with Top-Level Header and Footer

**Feature**: 016-global-app-shell
**Date**: 2026-06-14

## Prerequisites

- Node.js LTS and pnpm installed
- Repository cloned on branch `016-global-app-shell`
- Backend running (or mocked via test setup)

## Validation Scenarios

### Scenario 1: Unit Tests Pass (TDD Gate)

Run the frontend unit test suite:

```bash
cd packages/frontend
pnpm test
```

**Expected outcome**: All tests pass, including the new assertions added to `AppShell.test.tsx`:
- App name "Personal Contract Management" is present in the header
- Language picker is present in the header
- Theme toggle button is present in the header
- Language picker is absent from the sidebar settings section
- Footer renders via `contentinfo` role

---

### Scenario 2: Header Renders on All Authenticated Pages

Start the development server:

```bash
pnpm dev
```

Sign in and navigate to each route:

| Route | Expected Header Present |
|-------|------------------------|
| `/` (Dashboard) | Yes |
| `/contracts` | Yes |
| `/contracts/new` | Yes |
| `/account` | Yes |
| `/admin/accounts` (admin user only) | Yes |

**Check**: The header should show the app icon placeholder and the text "Personal Contract Management" on the left, and the language picker + theme toggle on the right.

---

### Scenario 3: Footer Anchored at Bottom

On any authenticated page:

1. With short content (e.g., Dashboard with few contracts): the footer should appear at the bottom of the viewport, not floating in the middle.
2. With tall content (e.g., Contracts list with many rows): scroll to the bottom — the footer appears below all content and does not overlap anything while scrolling.

---

### Scenario 4: Language Picker Works from Header

1. In the header, click the language picker (shows current language, e.g., "English").
2. Select a different language (e.g., "Deutsch").
3. **Expected**: UI text updates to German. Reload the page — language persists.

---

### Scenario 5: Theme Toggle Works from Header

1. In the header, click the theme toggle button (sun/moon icon).
2. **Expected**: Color scheme switches between light and dark. Reload the page — theme persists.

---

### Scenario 6: Sidebar No Longer Shows Language/Theme Controls

Sign in and inspect the left sidebar:

- **Expected**: No language picker dropdown in the sidebar.
- **Expected**: No sun/moon theme toggle in the sidebar.
- **Expected**: Navigation links (Dashboard, Contracts, Account Settings) still render.
- **Expected**: User display name and Sign Out button still render.
- **Expected**: Admin users still see the App/Admin segment control.

---

### Scenario 7: Unauthenticated Pages Unaffected

Navigate to:
- `/sign-in`
- `/invitations/:token` (any token value, even invalid)

**Expected**: No top-level header or global footer from the authenticated shell. These pages manage their own layout independently.

---

### Scenario 8: Mobile Viewport

Resize browser to a narrow width (below 768px / `sm` breakpoint):

- **Expected**: The header remains visible with app icon/name and controls accessible.
- **Expected**: A burger/hamburger button appears in the header to toggle the sidebar.
- **Expected**: Clicking the burger opens/closes the left sidebar.

---

## Type Check

```bash
cd packages/frontend
pnpm tsc --noEmit
```

**Expected outcome**: Zero type errors.

---

## Lint

```bash
cd packages/frontend
pnpm lint
```

**Expected outcome**: Zero lint errors or warnings.
