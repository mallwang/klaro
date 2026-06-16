# Quickstart Validation Guide: Admin Account Page Overhaul

## Prerequisites

- Node.js LTS + pnpm installed.
- A running local instance (backend + frontend) with at least two user accounts (one ADMIN,
  one MEMBER) and at least one pending invitation.
- Signed in as an admin user.

## Run the Tests

```bash
pnpm --filter @pcm/frontend test --run
```

All tests in `AccountsAdmin.test.tsx` must pass, including the new DOM-order tests.

```bash
pnpm --filter @pcm/frontend tsc --noEmit
```

No TypeScript errors.

## Start the Dev Server

```bash
pnpm --filter @pcm/frontend dev
```

Navigate to `http://localhost:5173` and sign in as an admin.

## Validation Scenarios

### Scenario 1 — Page layout order

1. Open **Admin → Manage Accounts**.
2. **Expected**: The accounts table (with user rows showing names, emails, roles, and status
   badges) is the first visible content below the page heading — no invitation form or other
   section appears before it.
3. Scroll down.
4. **Expected**: The "Pending Invitations" section heading appears next, followed by the inline
   invite row (email input + "Send Invitation" button), followed by the invitations table (or
   empty-state text if no invitations exist).
5. Continue scrolling.
6. **Expected**: The "Test Email" section heading and its description appear last, followed by
   the recipient email input and "Send Test Email" button.

### Scenario 2 — Page width

1. Resize the browser to a viewport wider than 900 px (e.g., 1440 px).
2. Open **Admin → Manage Accounts**.
3. Open **My Account** in a new tab.
4. **Expected**: Both pages have the same maximum content width, centred in the viewport.
   Neither extends to the full browser width.

### Scenario 3 — Invitation section alignment

1. Open **Admin → Manage Accounts** with at least one invitation present.
2. Inspect the rendered page visually.
3. **Expected**: The "Pending Invitations" section heading (Title) and the "Email" column
   header of the invitations table share the same left-edge content boundary — no visible
   horizontal offset between them.

### Scenario 4 — Invite a new user

1. In the Invitations section, type a new email address into the invite field.
2. Click **Send Invitation**.
3. **Expected**: A success toast appears; the email field clears; the new invitation appears
   in the table in the same section.

### Scenario 5 — Existing functionality (non-regression)

1. Archive an active member account — **Expected**: archived badge appears.
2. Reactivate an archived account — **Expected**: status returns to Active.
3. Change a member to admin — **Expected**: role badge updates.
4. Cancel a pending invitation — **Expected**: invitation status changes to Cancelled.
5. Resend an invitation — **Expected**: success toast appears.
6. Send a test email — **Expected**: success toast appears.

### Scenario 6 — Mobile viewport

1. Resize viewport to 375 px wide.
2. Open **Admin → Manage Accounts**.
3. **Expected**: All content is readable; tables scroll horizontally within their scroll
   containers; no horizontal overflow at the page level.
