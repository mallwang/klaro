# Quickstart Validation Guide: Scheduled Summary Email

## Prerequisites

- Working development environment (`pnpm dev` runs without error)
- SMTP configured in `.env` (or use a local trap like Mailpit/MailHog)
- At least one user account with active contracts

---

## 1. Verify Preference API

### 1a. Default state (disabled)

```bash
# Sign in first, then:
curl -s -b cookies.txt http://localhost:3000/api/profile/notification-preferences
```

Expected:
```json
{ "summaryEmailEnabled": false, "summaryEmailFrequency": null, "nextSendAt": null }
```

### 1b. Enable weekly

```bash
curl -s -X PATCH -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"summaryEmailEnabled":true,"summaryEmailFrequency":"WEEKLY"}' \
  http://localhost:3000/api/profile/notification-preferences
# → 204 No Content

curl -s -b cookies.txt http://localhost:3000/api/profile/notification-preferences
```

Expected: `summaryEmailEnabled: true`, `summaryEmailFrequency: "WEEKLY"`, `nextSendAt` = next Monday at `10:00:00.000Z`.

### 1c. Enable monthly

```bash
curl -s -X PATCH -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"summaryEmailEnabled":true,"summaryEmailFrequency":"MONTHLY"}' \
  http://localhost:3000/api/profile/notification-preferences
```

Expected: `nextSendAt` = 1st of next month at `10:00:00.000Z`.

### 1d. Validation rejection

```bash
curl -s -X PATCH -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"summaryEmailEnabled":true}' \
  http://localhost:3000/api/profile/notification-preferences
# → 400 Bad Request
```

---

## 2. Verify UI — Account Settings Page

1. Navigate to **Account Settings** → locate the **Summary Email** section.
2. Toggle is off by default; no "Next send" date shown.
3. Enable the toggle, select **Weekly**, save → "Next send" displays next Monday at 10:00 UTC.
4. Switch to **Monthly**, save → "Next send" updates to 1st of next month at 10:00 UTC.
5. Disable the toggle, save → "Next send" disappears.

---

## 3. Trigger a Test Send (Manual / Unit Test)

The `NotificationService` exposes a `sendSummaryEmailForUser(userId)` method for testing outside the scheduler.

```ts
// In a Vitest test or a throwaway script:
const service = new NotificationService(db, mailer, appUrl);
await service.sendSummaryEmailForUser('<user-id>');
```

Check the SMTP trap (Mailpit/MailHog) for an email containing:
- Subject: "Your [weekly|monthly] contract summary"
- Total monthly spending (formatted)
- Per-contract breakdown table
- Upcoming renewals section (or "no upcoming renewals" note)
- Dashboard link pointing to `APP_URL`
- CTA block if applicable (no contracts / cancellation-due)

---

## 4. Verify Anonymization

1. Mark one contract as **Anonymized** in the contract edit form.
2. Trigger a test send (step 3 above).
3. Confirm the anonymized contract's name does **not** appear in the email — a placeholder (e.g., "––––") is shown instead.

---

## 5. Verify Scheduler (Integration)

The scheduler registers two cron jobs at server startup. To verify they are wired up:

```bash
# In integration test or dev console:
# Inspect that CronService.start() does not throw and registers 2 jobs
```

For a production smoke test, enable weekly email for a test account, ensure the server is running at 10:00 UTC on a Monday, and verify delivery in the SMTP trap.

---

## 6. Verify No-Email Guard

1. Disable summary email for the test user (`summaryEmailEnabled: false`).
2. Trigger the scheduler's weekly job manually.
3. Confirm no email is sent to that user.

---

## References

- API contract: [notification-preferences-api.md](./contracts/notification-preferences-api.md)
- Data model: [data-model.md](./data-model.md)
- Research decisions: [research.md](./research.md)
