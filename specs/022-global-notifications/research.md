# Research: Global Notification System

## 1. @mantine/notifications API (v7)

**Decision**: Use `@mantine/notifications` v7, pinned to `^7.17.0` to match existing Mantine packages.

**Rationale**: It is the official Mantine extension for toast notifications. The project already uses `@mantine/core` v7.17 and `@mantine/hooks` v7.17, so this package is a natural, zero-friction fit with the existing theme, color scheme, and provider setup.

**Alternatives considered**:
- `react-hot-toast`: Lightweight, but requires separate theme wiring and would introduce a second notification library style.
- `sonner`: Popular, but not Mantine-native and adds friction to match the project's teal/dark-mode theme.
- Custom solution: Unnecessary given a well-maintained package exists in the same ecosystem.

**Key API facts**:
- `<Notifications />` component: renders the notification container. Must be placed inside `<MantineProvider>`. Position and default auto-close can be set globally here (`position="top-right"` and `autoClose={5000}`).
- `notifications.show({ message, color, autoClose })`: imperative API to push a notification. Can be called from any module, no hook required.
- No additional provider wrapping is needed beyond placing `<Notifications />` inside `MantineProvider`.

---

## 2. Notification helper pattern

**Decision**: Create a thin `src/lib/notifications.ts` utility with `showSuccess(message: string)` and `showError(message: string)` functions wrapping `notifications.show()`.

**Rationale**: Centralizing color and `autoClose` defaults prevents repetitive arguments at every call site and makes future global changes (e.g., adjusting duration) a single-line change. This is the minimum viable abstraction — two small wrapper calls, not a class or context.

**Alternatives considered**:
- Call `notifications.show()` directly everywhere: Works, but duplicates `color` and `autoClose` at every call site (~15+ locations), violating DRY in a way that will be painful to change.
- A `useNotify()` hook: Unnecessary — `notifications.show()` is not a hook-dependent API; a plain function is simpler and avoids Hook Rules constraints.

---

## 3. Testing strategy for @mantine/notifications

**Decision**: Render `<Notifications />` in the shared test wrapper (`renderWithProviders`) and assert on notification DOM output using `screen.getByText` / `screen.queryByText`.

**Rationale**: `@mantine/notifications` renders notification text into the DOM when `<Notifications />` is mounted, so standard `@testing-library/react` queries work without any special mocks. Calling `notifications.clean()` in `afterEach` prevents notification state from leaking between tests.

**Alternatives considered**:
- Mocking `notifications.show`: Avoids DOM assertion but tests the wrong level (implementation detail, not user-visible outcome). The constitution mandates testing user-visible behavior.
- Snapshot tests: Fragile; would need updating on every text change.

---

## 4. Pages and components to migrate

The following inline `<Alert>` uses are in the **authenticated zone** and must be replaced with toasts:

| Location | Feedback Type | i18n key(s) |
|----------|--------------|-------------|
| `AccountSettings.tsx` | displayName error/success | `accountSettings.displayNameError`, `accountSettings.displayNameSuccess` |
| `AccountSettings.tsx` | email change error/success | `accountSettings.emailChangeError`, `accountSettings.emailChangeConflict`, `accountSettings.emailChangeSent` |
| `AccountSettings.tsx` | password change error/success | `accountSettings.errorInvalidCurrent`, `accountSettings.errorGeneric`, `accountSettings.success` |
| `AccountsAdmin.tsx` – `InviteForm` | invite error/success | `accountsAdmin.duplicateEmailError`, `accountsAdmin.mailerError`, `accountsAdmin.inviteError`, `accountsAdmin.inviteSuccess` |
| `AccountsAdmin.tsx` – `TestEmailForm` | test email error/success | `accountsAdmin.testEmailMailerError`, `accountsAdmin.testEmailError`, `accountsAdmin.testEmailSuccess` |
| `AccountsAdmin.tsx` | account action errors (archive/reactivate/delete/role) | `accountsAdmin.lastAdminError`, `accountsAdmin.actionError` |
| `AccountsAdmin.tsx` | load error | `accountsAdmin.loadError` |
| `ContractList.tsx` | delete error / load error | `contractList.deleteError`, `contractList.loadError` |
| `ContractNew.tsx` / `ContractEdit.tsx` | submit error (via ContractForm prop) | error message from API |
| `DeleteAccountModal.tsx` | delete self error | `deleteModal.deleteError` |

The following **remain inline** (not migrated):
- `AccountSettings.tsx`: blue "pending email change" notice — informational persistent state, not an action result.
- `DeleteAccountModal.tsx`: orange "sole admin" warning — a blocking condition that must remain visible in-context.
- `ContractImport.tsx`: yellow column-mapping warnings — contextual guidance for the current step, not action results.
- All public pages: `AcceptInvitation`, `ResetPassword`, `ForgotPassword`, `EmailVerifyConfirm`, `SignIn`.

---

## 5. ContractForm error prop removal

**Decision**: Remove the `error` prop from `ContractForm`. Parent pages (`ContractNew`, `ContractEdit`) will use the `onError` callback of their mutations to call `showError()`.

**Rationale**: With notifications, `ContractForm` no longer needs to render error state — the parent already has the mutation and can call `showError()` in its `onError` callback. Keeping the prop would be dead code in the form itself after migration. This also simplifies the component signature.

**Impact**: `ContractForm` interface narrows by one optional prop. All callers (`ContractNew`, `ContractEdit`) updated accordingly.
