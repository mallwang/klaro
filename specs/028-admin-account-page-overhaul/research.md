# Research: Admin Account Page Overhaul

## Decision 1: Page Width Constraint

**Decision**: `maw={900} mx="auto"` on the outer `Stack`.

**Rationale**: `AccountSettings.tsx` (the My Account page) already uses this exact pair of
props. Matching it produces identical visual width without introducing a new magic number.
The spec asks for the same width as the My Account page — reading `AccountSettings.tsx`
directly confirms the value.

**Alternatives considered**: A wider constraint (e.g., `maw={1200}`) was not chosen because
the admin page contains forms and tables that don't need full-width layout. A container
component or CSS class was not chosen because the inline Mantine prop is the established
pattern in this codebase.

---

## Decision 2: Section Heading Hierarchy

**Decision**: Use `Title order={3}` for the two sub-section headings ("Pending Invitations",
"Test Email"), with `<Divider my="md" />` separating them and the accounts table. The page
heading remains `Title order={2}`.

**Rationale**: `AccountSettings.tsx` uses exactly this pattern: `Title order={2}` for the
page, `Title order={3}` for the "Email Settings" and "Account" sections, with Dividers
between them. Copying the pattern gives visual and semantic consistency across admin-area
pages and satisfies the spec requirement to align with the My Account page.

**Alternatives considered**: A `Paper` with a header row for each section (as used in some
Mantine examples) was rejected because it adds visual weight and nesting that the My Account
page avoids. Using `Text fw={700}` instead of `Title` was rejected because it breaks semantic
heading hierarchy.

---

## Decision 3: Dissolve `InviteForm` Sub-component

**Decision**: Remove the standalone `InviteForm` component entirely. Move its state and
handlers into `AccountsAdmin` and render the invite row inline above the `InvitationsTable`.

**Rationale**: The standalone `InviteForm` rendered inside its own `Paper` card with a bold
heading ("Invite a new user") was the root cause of the layout fragmentation: invite form and
invitations table appeared as two disconnected visual blocks. Inlining the invite row directly
above the table creates a single cohesive "Invitations" section. No logic changes are needed —
only JSX restructuring.

**Alternatives considered**: Keeping `InviteForm` as a sub-component but passing it a prop
to suppress its wrapping `Paper` was considered, but dissolving it is simpler (YAGNI) and
produces less indirection.

---

## Decision 4: Fix Heading/Column Alignment

**Decision**: Remove the `Text fw={600}` heading from inside `InvitationsTable`'s wrapping
`Paper`. Replace it with the parent `Title order={3}` rendered outside the `Paper`.

**Rationale**: The misalignment occurs because the `Text fw={600}` sits inside the same
`Paper` as the borderless `Table`, separated by `pb={0}` padding. The `Table.Th` cells have
their own internal horizontal padding, so the heading text and the first column header are
offset. By placing the section title outside the `Paper` container (as a sibling `Title`
above it), the table's own column header "Email" becomes the first visible text at the table's
left content boundary, and the section title lives in the normal page flow at the Stack level.
The visual result is that the section title no longer competes with the table headers for
left-edge alignment — they occupy different visual rows with natural spacing.

**Alternatives considered**: Matching the padding of the `Text` to the `Table.Th` padding
(`pl="sm"` or similar) was tried mentally but is fragile — table internal padding can vary
with Mantine version or theme. Moving the title outside the Paper is robust and idiomatic.

---

## Decision 5: i18n Keys — No New Keys Needed

**Decision**: Reuse existing translation keys for all headings:
- Invitations section title: `accountsAdmin.pendingInvitationsTitle` (already used inside `InvitationsTable`)
- Test Email section title: `accountsAdmin.testEmailTitle` (already used inside `TestEmailForm`)
- Test Email description: `accountsAdmin.testEmailDescription` (already used inside `TestEmailForm`)
- Invite form fields: all keys already defined in `InviteForm`

**Rationale**: The spec assumption states no new translation keys are needed. Examining the
existing keys confirms all required labels already exist.

**Alternatives considered**: Adding a new `accountsAdmin.accountsSectionTitle` key for a
"Accounts" sub-section label was considered but rejected — the page title already names the
primary content ("Manage Accounts"), and adding a redundant sub-heading would be verbose.
The accounts table is the dominant primary content and needs no separate label.
