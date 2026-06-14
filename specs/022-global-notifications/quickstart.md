# Quickstart Validation Guide: Global Notification System

## Prerequisites

- Dev server running: `pnpm --filter @pcm/frontend dev`
- Backend running: `pnpm --filter @pcm/backend dev`
- Admin account available for testing account management flows

---

## Scenario 1: Success notification — Password change

1. Sign in and navigate to **Account Settings** (`/account`).
2. Fill in current password and a new password, submit the form.
3. **Expected**: A green toast notification appears in the top-right corner with the success message. It dismisses automatically after ~5 seconds.
4. **Not expected**: No green `<Alert>` appears inside the form area.

---

## Scenario 2: Error notification — Wrong current password

1. Sign in and navigate to **Account Settings** (`/account`).
2. Enter an incorrect current password and submit.
3. **Expected**: A red toast notification appears with the "invalid current password" message. It auto-dismisses after ~5 seconds.
4. **Not expected**: No red `<Alert>` appears inline below the form.

---

## Scenario 3: Success notification — Invite user

1. Sign in as an admin, navigate to **Admin / Accounts** (`/admin/accounts`).
2. Enter a new email address and send an invitation.
3. **Expected**: A green toast notification confirms the invitation was sent. The email field clears.
4. **Not expected**: No green `<Alert>` appears inside the invite form.

---

## Scenario 4: Error notification — Duplicate invite

1. Sign in as an admin, navigate to **Admin / Accounts**.
2. Enter the email of an already-registered user and send an invitation.
3. **Expected**: A red toast notification appears with the "user already exists" message.
4. **Not expected**: No red `<Alert>` appears inside the invite form.

---

## Scenario 5: Error notification — Delete contract

1. Sign in and navigate to the **Contract List** (`/contracts`).
2. Delete a contract while the backend is unreachable (e.g., stop the backend server).
3. **Expected**: A red toast notification appears with the delete error message.
4. **Not expected**: No red `<Alert>` appears inline in the list.

---

## Scenario 6: Auto-dismiss timing

1. Trigger any success notification (e.g., save display name in Account Settings).
2. Observe the toast appears.
3. After approximately 5 seconds, the toast should dismiss without any user interaction.
4. **Not expected**: Toast remaining visible indefinitely.

---

## Scenario 7: Manual dismiss

1. Trigger any notification.
2. Click the close (×) button on the toast.
3. **Expected**: The toast dismisses immediately.

---

## Scenario 8: Multiple concurrent notifications

1. Trigger two actions in rapid succession (e.g., display name save and email change request).
2. **Expected**: Both notifications appear stacked without overlap.

---

## Scenario 9: Public pages retain inline feedback (regression check)

1. Navigate to `/forgot-password` (without signing in).
2. Enter any email and submit.
3. **Expected**: An inline confirmation message appears on the page.
4. **Not expected**: No toast notification appears.

1. Navigate to `/reset-password/invalidtoken`.
2. **Expected**: An inline error appears on the page.
3. **Not expected**: No toast notification appears.

---

## Scenario 10: Notification visible above modals

1. Sign in and open the **Delete Account** modal in Account Settings.
2. On step 2, trigger the delete while the backend returns an error.
3. **Expected**: A red error toast notification appears above the modal overlay.

---

## Scenario 11: Persistent inline notices unchanged

1. Sign in and navigate to **Account Settings**.
2. If a pending email change exists, the blue "pending email change" notice should still appear **inline** within the Email section (not as a toast).

---

## Running the unit test suite

```bash
pnpm --filter @pcm/frontend test
```

All existing tests should remain green. Notification-specific tests should verify that the correct notification message appears in the DOM after user actions.

---

## Running end-to-end tests

```bash
pnpm --filter @pcm/frontend test:e2e
```

Any Playwright tests covering account settings or admin flows should be updated to look for toast notification text rather than inline `<Alert>` elements.
