# Quickstart Validation Guide: Email Language Preference

## Prerequisites

- Working local development environment (`pnpm install` completed)
- SMTP configured (or Mailpit/MailHog running locally) — `SMTP_HOST`, `SMTP_FROM` set in `.env`
- App running: `pnpm dev` (backend on :3000, frontend on :5173)
- A test user account created (sign in or use the bootstrap admin)

---

## Scenario 1: Select and Persist Email Language in Account Settings

**Goal**: Verify FR-001 and FR-002 — the language selector appears and saves correctly.

**Steps**:
1. Sign in and navigate to **Account Settings**.
2. Locate the **Email Language** section (new panel, below or within the existing notification preferences section).
3. Confirm both "English" and "Deutsch" options are present.
4. Select "Deutsch" and click **Save**.
5. Reload the page.

**Expected**: The selector shows "Deutsch" after reload.

**API verification**:
```sh
curl -s http://localhost:3000/api/profile/notification-preferences \
  -H "Cookie: <your-session-cookie>" | jq .emailLanguage
# → "de"
```

---

## Scenario 2: Email Language Is Independent of UI Language

**Goal**: Verify FR-003 — changing UI language does not affect email language preference.

**Steps**:
1. Set the email language to "English" in Account Settings and save.
2. Switch the UI to German (language toggle in the nav).
3. Navigate back to Account Settings.

**Expected**: The email language selector still shows "English" (not German), confirming the two settings are independent.

---

## Scenario 3: Transactional Email Arrives in Preferred Language

**Goal**: Verify FR-004 and FR-005 — email verification email is sent in German with correct formatting.

**Setup**: Set email language to "Deutsch" and save.

**Steps**:
1. In the **Email Address** section, enter a new (valid) email address and click **Request email change**.
2. Open the email client / Mailpit inbox.

**Expected**:
- Email subject is in German.
- Email body is entirely in German.
- Any date displayed follows `DD.MM.YYYY` format.
- Any currency amount uses `.` as thousands separator and `,` as decimal separator.

---

## Scenario 4: Summary Email Arrives in Preferred Language

**Goal**: Verify Story 3 (FR-004, FR-005 applied to summary emails).

**Setup**: Set email language to "Deutsch". Ensure at least one contract exists.

**Steps**:
```sh
# Trigger a weekly summary email for your user
cd packages/backend
npx tsx src/scripts/send-summary-email.ts WEEKLY <your-user-id>
```
2. Check the inbox.

**Expected**:
- Email is entirely in German.
- Contract dates and amounts use German locale formatting.

**For English**: Switch email language back to "English", repeat, and confirm English content.

---

## Scenario 5: Default Language When No Preference Set

**Goal**: Verify FR-006 — new user without explicit preference receives emails in English.

**Steps**:
1. Create a new user via invitation (the invited user never sets an email language preference).
2. Trigger any email dispatch to that user.

**Expected**: Email arrives in English.

---

## Scenario 6: CI Template Coverage Check Passes

**Goal**: Verify FR-009 and FR-010 — all supported languages have all email templates.

**Steps**:
```sh
pnpm --filter backend test packages/backend/tests/unit/mailer.strings.test.ts
```

**Expected**: All assertions pass. No missing locale × email-type combinations reported.

---

## Scenario 7: CI Coverage Check Catches a Missing Template

**Goal**: Confirm the guard works.

**Steps**:
1. Temporarily add `'it'` to `SUPPORTED_EMAIL_LANGUAGES` in shared (do **not** add Italian strings to `mailer.strings.ts`).
2. Run the test:
```sh
pnpm --filter backend test packages/backend/tests/unit/mailer.strings.test.ts
```

**Expected**: Test fails with a clear message identifying which email type is missing the `'it'` locale entry. Revert the change after confirming.

---

## Scenario 8: Fallback to English for Unsupported Stored Locale

**Goal**: Verify FR-007 and FR-008 — graceful degradation.

**Steps**:
1. Manually set `email_language = 'fr'` for a user in SQLite:
   ```sh
   sqlite3 data/contracts.db "UPDATE users SET email_language = 'fr' WHERE email = 'test@example.com'"
   ```
2. Trigger any email for that user.

**Expected**: Email is delivered in English (fallback). A warning is logged on the backend, but no error is surfaced to the user.
