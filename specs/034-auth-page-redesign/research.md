# Research: Authentication Page Redesign

**Branch**: `034-auth-page-redesign` | **Date**: 2026-06-18

## Decision 1: Two-column layout implementation in Mantine 7

**Decision**: Use Mantine `Grid` with `visibleFrom="sm"` on the image column to implement the two-column layout. The left column is a `Box` with a `BackgroundImage` (or `Image`) filling the full height; the right column is a `Center` containing the form.

**Rationale**: Mantine 7's `Grid` with `visibleFrom` is the idiomatic way to achieve responsive column hiding. The `Grid.Col` with `visibleFrom="sm"` automatically hides on xs viewports (< 576 px), making the form full-width on mobile without custom CSS or media queries. `BackgroundImage` from `@mantine/core` renders a `div` with `background-image` and `background-size: cover`, which matches the Mantine authentication-image template.

**Alternatives considered**:
- `SimpleGrid` with `breakpoints`: Less flexible for asymmetric column widths (e.g., image 55%, form 45%).
- CSS Modules with a manual flex layout: Works but bypasses Mantine's design system and responsive utilities — violates the project's Mantine-first convention.
- `Paper` overlay on a full-page background image: Less accessible and harder to constrain the form width.

---

## Decision 2: Sign-in / forgot-password form toggling

**Decision**: Create a single `AuthPage.tsx` component that accepts `initialView: 'sign-in' | 'forgot-password'`. Internal React `useState` controls which form is rendered. The "Forgot password?" and "Back to sign in" links call `setView(...)` directly — no `navigate()` call — so the URL does not change and no page remount occurs.

**Rationale**: The spec requires the transition to happen "without a full page reload" (FR-005). Updating React state is the cleanest way to guarantee this. Keeping both forms in one component also means the `AuthImageLayout` shell (including the image panel) is never remounted during the toggle, which prevents any image flicker.

**Alternatives considered**:
- Keep separate `SignIn.tsx` and `ForgotPassword.tsx` pages, navigate between routes: React Router v7 SPA navigation does not cause a browser page reload, but it does unmount and remount the full component tree, including the image panel. The image would visually flash/reload on slower connections.
- Use a URL hash or query-param (`/sign-in?view=forgot-password`): Adds URL complexity for no clear benefit; the spec does not require the view state to be bookmarkable.
- Use a Mantine `Transition` or `Tabs` component: Introduces animation which is not specified. YAGNI applies.

Both `/sign-in` and `/forgot-password` URL routes continue to render `AuthPage` (via React Router config), so direct deep links (FR-007) still work.

---

## Decision 3: Image for the decorative panel

**Decision**: Use a static SVG or gradient `Box` as the initial placeholder image. The specific image is a visual detail not specified in the spec and left to the implementer at coding time. The `AuthImageLayout` component accepts an optional `imageUrl` prop that defaults to a built-in asset.

**Rationale**: The spec mandates the layout structure, not the image content. Hardcoding a specific stock photo URL would introduce an external dependency. A local asset (or CSS gradient) keeps the app fully self-contained and allows the image to be swapped without touching component logic.

**Alternatives considered**:
- Embed a Unsplash URL: Works but introduces external runtime dependency; image may 404 in the future.
- Require the image at the page level as a mandatory prop: Breaks the "reusable layout" goal (FR-008) by forcing each consumer to supply an image.

---

## Decision 4: Fate of existing AuthCard, SignIn, ForgotPassword files

**Decision**: `SignIn.tsx` and `ForgotPassword.tsx` are deleted; their logic is merged into `AuthPage.tsx`. `AuthCard.tsx` and `PublicLayout.tsx` are kept unchanged.

**Rationale**: `AuthPage.tsx` replaces both pages cleanly. Keeping both old files would require updating them to stub-out or re-export, which is unnecessary ceremony. `AuthCard` is still in active use by `ResetPassword`, `AcceptInvitation`, and `EmailVerifyConfirm` — removing it would scope-creep beyond the spec.

**Alternatives considered**:
- Keep `SignIn.tsx` and `ForgotPassword.tsx` as thin wrappers over `AuthPage`: Retains the file topology but adds dead wrapper files with no independent logic. Violates YAGNI.

---

## Decision 5: i18n additions

**Decision**: Add a small set of new translation keys under an `authPage` namespace for any text that belongs to `AuthImageLayout` itself (e.g., a tagline or panel heading displayed in the image column). All existing `auth.*` and `forgotPassword.*` keys are kept as-is.

**Rationale**: The image panel may show a brand tagline or application name below the image. These strings need to be internationalised to match the project's en/de convention. Reusing the existing `auth.*` namespace would pollute it with layout-level strings unrelated to the form logic.

**Alternatives considered**:
- Add the panel text inline as hardcoded English strings: Breaks the existing i18n convention used everywhere else in the project.
- No text in the image panel: Valid option — implementer may choose a purely decorative image panel. If so, no new i18n keys are needed.
