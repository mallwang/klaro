# Implementation Plan: Admin Account Page Overhaul

**Branch**: `028-admin-account-page-overhaul` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/028-admin-account-page-overhaul/spec.md`

## Summary

Reorganise `AccountsAdmin.tsx` — the admin-only Manage Accounts page — so that the accounts
table comes first, followed by a compact invitations section (inline invite form above the
invitations table), and the test email utility last. Constrain the page to `maw={900} mx="auto"`
to match the My Account page width. Adopt the same two-section-title + Divider pattern used in
`AccountSettings.tsx`. Remove the standalone `InviteForm` `Paper` card and merge the invite
input into the invitations section. Fix the visual misalignment between the "Pending Invitations"
heading and the "Email" column header. No backend, API, or i18n changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode) / React 18.3

**Primary Dependencies**: `@mantine/core` v7 (Stack, Title, Divider, Group, TextInput, Button, Paper, Table — all already in use)

**Storage**: N/A — no database or schema changes

**Testing**: Vitest + Testing Library + userEvent

**Target Platform**: Web browser (Vite SPA)

**Project Type**: Web application — pnpm monorepo, frontend package `@pcm/frontend`

**Performance Goals**: N/A — layout-only change, no new network requests or heavy computation

**Constraints**: All existing account and invitation actions must keep working; existing tests must be updated rather than removed

**Scale/Scope**: Single page component (`AccountsAdmin.tsx`) + its test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First | ✅ Required | New layout-order tests and the new DOM-ordering assertion must be written as failing tests before the component is changed. Existing passing tests that verify functionality (invite form, test email, role/archive buttons) are unaffected by layout and do not need to be written first — but any test that asserts on structure must be updated before the implementation. |
| II. Type Safety | ✅ Compliant | No new props or state introduced. The `InviteForm` sub-component may be dissolved; its local state and mutation hook are moved inline — still fully typed. |
| III. YAGNI | ✅ Compliant | No new abstractions, hooks, or components. The refactor removes a component (`InviteForm` standalone card) rather than adding one. Dividers and section titles reuse the pattern already established in `AccountSettings`. |

**Post-design re-check**: No violations found. No Complexity Tracking entry needed.

## Project Structure

### Documentation (this feature)

```text
specs/028-admin-account-page-overhaul/
├── plan.md              # This file
├── research.md          # Layout decisions and reference patterns
├── data-model.md        # N/A — no data model changes (see file for rationale)
├── quickstart.md        # Validation guide
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code

```text
packages/frontend/
└── src/
    └── pages/
        └── admin/
            └── AccountsAdmin.tsx          # layout overhaul (sole changed source file)

packages/frontend/tests/unit/
└── AccountsAdmin.test.tsx                 # new DOM-order tests; existing tests unaffected
```

No new files are created in `src/`. No contracts directory needed (no API changes).

## Implementation Steps

### Step 1 — Add failing DOM-order test

In `AccountsAdmin.test.tsx`, add a new `describe` block:

```text
describe('AccountsAdmin – layout order', () => {
  it('renders accounts table before the invitations section', () => {
    renderPage();
    // Locate the accounts table and the invite email input in the DOM;
    // assert that the accounts table's position precedes the invite input's position.
    // Use element.compareDocumentPosition or check rendered order with getAllByRole.
  });

  it('renders the test email section after the invitations section', () => {
    renderPage();
    // Locate the invite section heading and the test email heading;
    // assert the test email heading appears after the invite section heading in the DOM.
  });
});
```

Run the tests — confirm they fail before touching the component.

### Step 2 — Overhaul `AccountsAdmin.tsx`

Apply the following structural changes to the returned JSX (no logic changes):

1. **Outer container**: Change `<Stack gap="lg">` to `<Stack gap="lg" maw={900} mx="auto">`.

2. **Section order** (top to bottom inside the Stack):
   a. Page title block (unchanged: `Title order={2}` + subtitle `Text`).
   b. Accounts table `Paper` (moved from the bottom to here).
   c. `<Divider my="md" />`.
   d. Invitations section — `Title order={3}` with `t('accountsAdmin.pendingInvitationsTitle')`,
      then an inline invite row (`Group align="flex-end"` with `TextInput` + `Button`),
      then the `InvitationsTable` content (without its internal heading `Text fw={600}`).
   e. `<Divider my="md" />`.
   f. Test email section — `Title order={3}` with `t('accountsAdmin.testEmailTitle')`,
      then the existing `TestEmailForm` body (without its internal `Text fw={600}` heading,
      since the section `Title` replaces it).

3. **`InviteForm` sub-component**: Dissolve. Move its local `email` state, `sendInvitation`
   hook call, `resolveInviteError`, and `handleSubmit` up into the parent `AccountsAdmin`
   component. Render the invite row inline inside the Invitations section.

4. **`InvitationsTable`**: Remove the `Text fw={600}` heading from inside the `Paper` (the
   `Title order={3}` in the parent section already labels this area). Keep the `Paper`, the
   `Table.ScrollContainer`, and all invitation row logic unchanged.

5. **`TestEmailForm`**: Remove the `Text fw={600}` heading and subtitle `Text` from inside
   the `Paper` (replaced by section title and description rendered in the parent). Keep the
   form `Paper`, input, and button unchanged. The description text (`t('accountsAdmin.testEmailDescription')`)
   can be moved just below the `Title order={3}` as a `Text size="sm" c="dimmed"` sibling.

6. **Loading / error state**: The loading spinner and error handling for accounts remain in
   place; no logic changes.

7. **Delete confirmation Modal**: Stays at the bottom of the JSX, outside the Stack, unchanged.

### Step 3 — Run tests and verify

```bash
pnpm --filter @pcm/frontend test --run
```

All tests (existing + new) must pass. Then verify there are no TypeScript errors:

```bash
pnpm --filter @pcm/frontend tsc --noEmit
```

### Step 4 — Visual verification

Start the dev server and confirm in the browser:

- Accounts table visible immediately without scrolling on a 1280 px viewport.
- Invitations section appears below accounts, with the invite email input as an inline row
  above the table (or empty-state message).
- "Pending Invitations" heading and the "Email" column header share the same left edge.
- Test Email section is last.
- Page width matches My Account page (centred, max ~900 px).

### Step 5 — Update docs

Per CLAUDE.md and the constitution:
- Update `README.md` and `README.de.md` to reflect the improved admin page layout.
- Update `docs/user-guide.md` and `docs/user-guide.de.md` with the new section structure.
