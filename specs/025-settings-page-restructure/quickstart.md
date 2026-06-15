# Quickstart Validation Guide: Account Settings Page Restructure

**Branch**: `025-settings-page-restructure`

## Prerequisites

- Node.js LTS + pnpm installed
- Project dependencies installed: `pnpm install` from repo root
- A running backend (or `pnpm --filter backend dev`) is needed for e2e tests only; unit tests
  run standalone

## Validation Scenarios

### Scenario 1 — Unit tests pass (fastest check)

```bash
pnpm --filter frontend test run
```

**Expected outcome**: All tests in `AccountSettings.test.tsx` pass, including the new
"Section headings" describe block which asserts that both heading texts are present.

---

### Scenario 2 — Both section headings visible in the browser

1. Start the dev server: `pnpm --filter frontend dev`
2. Sign in as any user and navigate to **Account Settings**.
3. Verify visually:
   - A heading "Email Settings" (or "E-Mail-Einstellungen" in German UI) appears above the
     summary email toggle and the email language control.
   - A heading "Account" (or "Konto" in German UI) appears above the display name form.
   - A divider or clear whitespace separates the two sections.
4. No controls have disappeared or changed position within their respective sections.

---

### Scenario 3 — All existing controls still function

From the Account Settings page:

| Action | Expected result |
|--------|----------------|
| Toggle summary email on → save | Success toast; preference persists on reload |
| Change email language → save | Success toast; preference persists on reload |
| Edit display name → save | Success toast; name updates in header |
| Request email change → submit | Success toast; pending notice appears |
| Change password (correct current) | Success toast |
| Change password (wrong current) | Error toast "The current password is incorrect." |
| Click "Delete Account" (non-sole-admin) | Delete confirmation modal opens |
| Click "Delete Account" (sole admin) | Blocking message shown; deletion not possible |

---

### Scenario 4 — German translation

1. Switch the UI language to German.
2. Navigate to Account Settings.
3. Verify headings read "E-Mail-Einstellungen" and "Konto".

---

### Scenario 5 — i18n catalogue type-check

```bash
pnpm --filter frontend tsc --noEmit
```

**Expected outcome**: No TypeScript errors; the two new i18n keys are present in
`types.d.ts` (or the catalogue is auto-generated without errors).
