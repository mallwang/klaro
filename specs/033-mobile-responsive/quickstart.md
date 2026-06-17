# Quickstart: Mobile-Responsive Web App

**Feature**: 033-mobile-responsive | **Date**: 2026-06-17

This guide validates the feature end-to-end once implemented. It does not duplicate requirement details — see [spec.md](spec.md) for acceptance criteria and [data-model.md](data-model.md) for the affected components.

## Prerequisites

- Repository checked out on `033-mobile-responsive`
- Dependencies installed: `pnpm install` at the repo root
- Backend + frontend dev servers runnable via the existing project scripts

## Automated Validation

```bash
# Unit/component tests (Vitest)
pnpm --filter @pcm/frontend test

# Type check
pnpm --filter @pcm/frontend exec tsc --noEmit

# Lint
pnpm --filter @pcm/frontend lint

# End-to-end tests, including the new mobile-viewport project
pnpm --filter @pcm/frontend test:e2e
```

All of the above must exit with zero errors, including the new mobile-specific assertions described in [plan.md](plan.md#project-structure).

## Manual Validation

1. Start the app: `pnpm --filter @pcm/backend dev` and `pnpm --filter @pcm/frontend dev`.
2. Open the app in a desktop browser and switch on device emulation (e.g. Chrome DevTools → Toggle device toolbar) at 375×667 (iPhone SE/8 class) and 320×568 (smallest common phone).
3. Walk through each in-scope page and confirm against the spec's acceptance scenarios:
   - **Navigation** (User Story 1): open the burger menu, confirm every nav item is reachable and tappable, confirm no horizontal page scroll.
   - **Contracts list & form** (User Story 2): confirm Name/Amount/End date remain visible in the table without zooming; open a contract for edit, confirm the form stacks in one column and saves successfully.
   - **Dashboard** (User Story 3): confirm the spending overview, upcoming renewals, and expired contracts widgets stack vertically and are fully readable.
   - **Account settings / admin** (User Story 4): confirm forms and the accounts/invitations tables remain usable, including the previously non-responsive diagnostics `SimpleGrid` on the admin page.
4. Rotate the emulated device to landscape at the same widths and confirm nothing is clipped or overlapping (landscape only needs to remain usable, not separately optimized — see spec Assumptions).
5. Tab/click through interactive elements to spot-check the 44×44px touch target requirement on buttons, menu items, and table row actions.
6. Re-run the same walkthrough at a desktop width (e.g. 1280px) to confirm no regression in the existing layout.

## Expected Outcome

- No page in scope requires horizontal scrolling of the page body at 320–480px.
- The contracts and admin tables show only their highest-priority columns at phone widths, with no information permanently lost (full details remain reachable from the row).
- All automated tests (unit + E2E, including the new mobile project) pass.
- Desktop/tablet behavior is visually unchanged from before the feature.
