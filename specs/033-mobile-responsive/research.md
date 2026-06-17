# Research: Mobile-Responsive Web App

**Feature**: 033-mobile-responsive | **Date**: 2026-06-17

## Decision 1: Breakpoint Strategy

**Decision**: Use Mantine's default breakpoint tokens (`xs: 36em`/576px, `sm: 48em`/768px) rather than introducing custom breakpoints. Treat `sm` (768px) as the phone/desktop boundary, consistent with the existing `AppShell` navbar (`breakpoint: 'sm'`) and the existing `ContractForm.module.css` media query (`max-width: 48em`).

**Rationale**: The app's theme (`packages/frontend/src/main.tsx`) does not override `breakpoints`, so it already uses Mantine's defaults everywhere. Several places already key off `sm`/48em. Introducing a second breakpoint scale would create inconsistency between components for no benefit.

**Alternatives considered**:
- Custom breakpoint scale tuned to specific device widths: rejected — adds a second source of truth and contradicts Simplicity (YAGNI); Mantine's defaults already cover the 320–480px target range under `base`/`xs`.

---

## Decision 2: Data-Dense Table Strategy (resolves spec FR-004)

**Decision**: Hide lower-priority `Table.Th`/`Table.Td` cells at phone-sized breakpoints using Mantine's `visibleFrom="sm"` / `hiddenFrom="sm"` props, keeping the existing `Table` + `Table.ScrollContainer` markup. No card-based rewrite, no new list component.

- **Contracts table** (`ContractTable.tsx`): keep Name, Amount, Actions visible at all sizes; hide Category and Status below `sm`; keep End date visible (called out explicitly in the spec's acceptance scenario) by collapsing Category/Status into it only if width still doesn't fit — first pass hides Category and Status only.
- **Admin accounts table** (`AccountsAdmin.tsx`, members list): keep Name, Status, Actions visible at all sizes; hide Email and Role below `sm` (both remain visible via the row when expanded/edited, since role changes already happen through an inline control reachable after the row is focused).
- **Admin invitations table** (`AccountsAdmin.tsx`, invitations list): keep Email, Invitation status, Actions visible at all sizes; hide Sent at and Date below `sm`.

**Rationale**: This was the explicit, user-confirmed choice (column reduction over card layout or horizontal scroll) during `/speckit-specify`. `visibleFrom`/`hiddenFrom` are existing Mantine v7 utilities already used elsewhere in the codebase (`TopHeader.tsx` uses `hiddenFrom="sm"` for the burger button), so no new pattern is introduced. `Table.ScrollContainer` (already present on both tables) remains as a safety net for any residual overflow rather than being relied upon as the primary strategy.

**Alternatives considered**:
- Card-based row layout on mobile: rejected by the user (more implementation work, a second layout to maintain and test).
- Horizontal scroll only (status quo): rejected by the user (already what the `Table.ScrollContainer` does today — the feature exists specifically to improve on that).

---

## Decision 3: Dashboard Widgets

**Decision**: No structural change needed. `Dashboard.tsx` already renders `SpendingOverview`, `UpcomingRenewals`, and `ExpiredContracts` inside a single-column `Stack`. `SpendingOverview`'s internal `SimpleGrid cols={{ base: 1, xs: 3 }}` already collapses to one column below the `xs` breakpoint. Audit only — no code change expected unless manual testing surfaces an issue (e.g. the stat cards' fixed `borderBottomColor` styling or the progress bar labels overflowing at 320px).

**Rationale**: Avoid speculative changes to code that is already responsive (Simplicity/YAGNI). The plan task list will include a manual verification step rather than a blind rewrite.

---

## Decision 4: Forms

**Decision**: No structural change needed for `ContractForm.tsx` — it already collapses its grid rows (`nameRow`, `twoColumnRow`, `statusDateRow`, `cancellationAnonymizeRow`) to a single column via a `@media (max-width: 48em)` rule in `ContractForm.module.css`. Audit `AccountSettings.tsx`, `SignIn.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, and `AcceptInvitation.tsx` for any non-collapsing multi-column rows and apply the same media-query pattern where needed, for consistency with the existing approach rather than introducing Mantine `Grid`/`SimpleGrid` in some places and CSS grid in others.

**Rationale**: Reuse the established pattern (CSS module media query at 48em) already proven in `ContractForm.module.css` instead of introducing a second responsive mechanism.

---

## Decision 5: Touch Target Sizing (resolves FR-003)

**Decision**: Audit interactive elements against a 44×44px minimum using Mantine's existing size props (`size="sm"` default Button/ActionIcon height is 36px and is too small at `compact-sm`/`xs` sizes used in tables). Rather than globally overriding Mantine's default sizes (which would affect desktop too and risk visual regressions), increase tap target via padding/CSS only on the specific controls identified as undersized during manual audit (e.g. table row action buttons, navbar burger, pagination items), scoped to phone breakpoints only.

**Rationale**: Keeps desktop's intentionally compact look (established by feature 029) untouched while meeting the mobile touch-target requirement. Avoids a global size bump that would contradict the "compact" design direction already chosen for desktop.

**Alternatives considered**: Globally switching all compact buttons to a larger Mantine size — rejected, would regress the compact desktop look from feature 029 and isn't necessary since CSS padding can satisfy the 44px target without changing visual size on desktop.

---

## Decision 6: Modals on Mobile

**Decision**: Audit existing Mantine `Modal` usages (`DeleteAccountModal.tsx`, the contract delete confirmation inline UI, the import column-mapping table) for the `fullScreen` prop conditioned on viewport, using Mantine's `useMediaQuery` hook (`@mantine/hooks`, already a dependency) to detect phone-sized screens and pass `fullScreen` to `Modal` only on mobile. No new dependency.

**Rationale**: Mantine's `Modal` already supports a `fullScreen` prop designed for exactly this use case; `useMediaQuery` is already imported elsewhere indirectly through Mantine but not yet used directly in the codebase — this is the first direct usage, which is still zero new dependencies since `@mantine/hooks` is already installed.

**Alternatives considered**: A custom CSS-only modal sizing override — rejected, reinvents what Mantine's `fullScreen` prop already does.

---

## Decision 7: On-Screen Keyboard Behavior (resolves FR-010)

**Decision**: Rely on native browser `scrollIntoView` behavior triggered by Mantine's input focus handling and standard HTML form semantics; no custom JavaScript scroll-management code. Verify manually on a real or emulated mobile browser as part of the quickstart validation rather than adding a `useEffect`-based scroll-into-view hook.

**Rationale**: Modern mobile browsers (iOS Safari, Chrome Android) already scroll focused inputs into view above the on-screen keyboard by default as long as the input isn't inside a fixed-position container that traps it. The existing `AppShell` uses Mantine's `AppShell.Main` (normal flow, not fixed), so no known conflict exists. Adding custom scroll-handling code without a demonstrated problem would violate Simplicity (YAGNI).

**Alternatives considered**: A custom `IntersectionObserver`/scroll hook — rejected pending evidence of an actual problem; can be added later if manual testing finds a real issue.

---

## Decision 8: E2E Testing Approach for Mobile Viewports

**Decision**: Add a dedicated Playwright project (`mobile-chromium`) to `playwright.config.ts` using `devices['iPhone 13']` (or equivalent) from `@playwright/test`, scoped to the existing `tests/e2e` test files relevant to this feature (navigation, contracts list, contract form, dashboard). Reuse existing spec files with `test.describe` blocks rather than duplicating entire test files, OR add a small number of new `*-mobile.spec.ts` files that assert mobile-specific behavior (column hiding, burger menu) using `test.use({ viewport: ... })` for targeted cases. Exact split is decided during `/speckit-tasks`.

**Rationale**: Playwright's built-in `devices` presets (already part of the installed `@playwright/test` dependency) provide realistic mobile viewport + user-agent + touch emulation without adding any new package.

**Alternatives considered**: Manual-only testing — rejected; Principle I (Test-First) requires automated coverage for new behavior (column visibility, navigation menu reachability) wherever feasible.

---

## Decision 9: Scope Confirmation

**Decision**: In scope: `AppShell`/`NavbarSegmented`/`TopHeader`/`FooterSimple`, `Dashboard` + its three widgets, `ContractList` + `ContractTable`, `ContractForm` (new/edit), `AccountSettings`, `AccountsAdmin`, `Faq`, `SignIn`, `ForgotPassword`, `ResetPassword`, `AcceptInvitation`, `ContractImport` (column mapping table), `DeleteAccountModal`. Out of scope: any backend change, any new page, any PWA/installability work (per spec Assumptions).

**Rationale**: Matches the spec's Assumptions section exactly; listed here so the implementation plan's Project Structure section has a concrete, exhaustive file list.
