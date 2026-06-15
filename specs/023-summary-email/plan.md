# Implementation Plan: Scheduled Summary Email

**Branch**: `023-summary-email` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/023-summary-email/spec.md`

## Summary

Each user can opt into a weekly (Monday) or monthly (1st of month) summary email delivered at 10:00 UTC. The email lists total monthly contract spending, a per-contract breakdown, upcoming renewals within the next 30 days, a dashboard link, and a context-aware call to action. Preferences are managed in Account Settings, which also displays the next scheduled send datetime. The scheduler runs in-process using `node-cron` wired up at server startup.

## Technical Context

**Language/Version**: TypeScript 5.5, strict mode, ESM modules

**Primary Dependencies**:
- Backend: Fastify 5, better-sqlite3, nodemailer (all existing); `node-cron` v3 (new)
- Frontend: React 18, Mantine 7, React Query 5 (all existing)
- Shared: Zod 3 (existing)

**Storage**: SQLite via better-sqlite3; two new columns on `users` table

**Testing**: Vitest 4 (unit + integration), Playwright (e2e)

**Target Platform**: Node.js LTS, Linux server (Docker)

**Project Type**: Full-stack web application (monorepo: backend / frontend / shared)

**Performance Goals**: Standard web app expectations; scheduler triggers at most a few dozen sends per fire (personal-use scale)

**Constraints**: UTC-only scheduling; no user-timezone support in v1; email anonymization follows per-contract DB flag only (global toggle is client-side only)

**Scale/Scope**: Personal-use, small user base; no queue or retry infrastructure needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

- **PASS**: All new services (`NotificationService`, `SchedulerService`), the new mailer method, preference routes, and the next-send calculator MUST have Vitest unit tests written before implementation code.
- Scheduler integration verified via a test that calls the notification service directly rather than waiting for cron ticks.

### Principle II — Type Safety (NON-NEGOTIABLE)

- **PASS**: All new types (`NotificationPreferences`, `SummaryEmailData`, `CtaState`, `EmailSummaryFrequency`) defined in the shared package and imported across backend/frontend.
- New Zod schemas added to `packages/shared/src/schemas/profile.ts` for the PATCH request body.
- No `any` introduced; `strict: true` remains enabled.

### Principle III — Simplicity (YAGNI)

- **PASS**: Preference stored as two columns on the existing `users` table — no new table.
- `node-cron` is the only new dependency; no queue, retry, or delivery-tracking infrastructure.
- Email bodies use inline template literals consistent with all existing mailer methods.
- `sendSummaryEmailForUser(userId)` is the sole public method on `NotificationService`; the scheduler calls it in a loop over opted-in users.

**No violations to track.**

## Project Structure

### Documentation (this feature)

```text
specs/023-summary-email/
├── plan.md              ← this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── notification-preferences-api.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
packages/shared/src/
├── schemas/
│   └── profile.ts              # MODIFIED — add UpdateNotificationPreferencesBodySchema
├── types/
│   └── user.ts                 # MODIFIED — add EmailSummaryFrequency, NotificationPreferences
└── index.ts                    # MODIFIED — export new symbols

packages/backend/src/
├── db/
│   ├── schema.sql              # MODIFIED — add summary_email_* columns to users
│   └── client.ts               # MODIFIED — migration guard for new columns
├── routes/
│   └── profile.ts              # MODIFIED — add GET/PATCH /api/profile/notification-preferences
├── services/
│   ├── mailer.service.ts       # MODIFIED — add sendSummaryEmail()
│   ├── notification.service.ts # NEW — query opted-in users, build payload, call mailer
│   └── scheduler.service.ts   # NEW — node-cron jobs, wired to NotificationService
└── index.ts                    # MODIFIED — start scheduler after server starts

packages/frontend/src/
├── hooks/
│   └── useNotificationPreferences.ts  # NEW — React Query get + mutate for preferences
└── pages/
    └── AccountSettings.tsx            # MODIFIED — add Summary Email section
```

## Implementation Steps

### Step 1 — Shared types and schemas

1. Add to `packages/shared/src/types/user.ts`:
   - `type EmailSummaryFrequency = 'WEEKLY' | 'MONTHLY'`
   - `interface NotificationPreferences { summaryEmailEnabled: boolean; summaryEmailFrequency: EmailSummaryFrequency | null; nextSendAt: string | null; }`

2. Add to `packages/shared/src/schemas/profile.ts`:
   - `UpdateNotificationPreferencesBodySchema` — Zod object:
     - `summaryEmailEnabled`: `z.boolean()`
     - `summaryEmailFrequency`: `z.enum(['WEEKLY','MONTHLY']).optional()` with a `.superRefine` rule that rejects enabled=true without a frequency

3. Export new symbols from `packages/shared/src/index.ts`.

**Tests (write first)**:
- Zod schema validation in `packages/shared/src/schemas/__tests__/profile.test.ts`
  - enabled=true + no frequency → error
  - enabled=true + valid frequency → passes
  - enabled=false + no frequency → passes
  - Unknown frequency value → error

---

### Step 2 — Database migration

1. Add to `packages/backend/src/db/schema.sql` (inside `CREATE TABLE users`):
   ```sql
   summary_email_enabled   INTEGER NOT NULL DEFAULT 0,
   summary_email_frequency TEXT CHECK(summary_email_frequency IN ('WEEKLY','MONTHLY'))
   ```

2. Add migration guard in `runMigrations()` in `client.ts`:
   ```ts
   const hasSummaryEmail = instance.prepare(...`PRAGMA table_info(users)`...).all()
     .some(col => col.name === 'summary_email_enabled');
   if (!hasSummaryEmail) {
     instance.exec(`
       ALTER TABLE users ADD COLUMN summary_email_enabled INTEGER NOT NULL DEFAULT 0;
       ALTER TABLE users ADD COLUMN summary_email_frequency TEXT
         CHECK(summary_email_frequency IN ('WEEKLY','MONTHLY'));
     `);
   }
   ```

**Tests (write first)**:
- Migration guard in `packages/backend/src/db/__tests__/client.test.ts` (already uses `createDb(':memory:')` pattern):
  - `runMigrations` on a fresh DB → columns present
  - `runMigrations` twice → idempotent (no error)

---

### Step 3 — Next-send datetime calculator

New pure function `computeNextSendAt(frequency: EmailSummaryFrequency, now?: Date): string` in `packages/backend/src/services/notification.service.ts` (or a dedicated `scheduler.utils.ts`).

Logic:
- **WEEKLY**: advance `now` to the next Monday. If today is Monday and `now.getUTCHours() < 10`, use today. Otherwise, advance to next Monday. Set time to 10:00:00.000 UTC.
- **MONTHLY**: if today is the 1st and `now.getUTCHours() < 10`, use today. Otherwise use the 1st of next month. Set time to 10:00:00.000 UTC.
- Return `.toISOString()`.

**Tests (write first)** — `packages/backend/src/services/__tests__/notification.service.test.ts`:
- Monday before 10:00 UTC → same day 10:00
- Monday at/after 10:00 UTC → next Monday
- Non-Monday weekday → next Monday
- 1st of month before 10:00 UTC → same day 10:00
- 1st of month at/after 10:00 UTC → 1st of next month
- Non-1st day → 1st of next month
- December edge case: 1st of January next year

---

### Step 4 — Notification service

New class `NotificationService` in `packages/backend/src/services/notification.service.ts`.

```ts
class NotificationService {
  constructor(
    private db: Database.Database,
    private mailer: MailerService,
    private appUrl: string,
  ) {}

  /** Fetches opted-in users for the given frequency and sends a summary email to each. */
  async sendSummaryEmails(frequency: EmailSummaryFrequency): Promise<void>

  /** Sends a summary email for a single user (public for testing/manual trigger). */
  async sendSummaryEmailForUser(userId: string): Promise<void>
}
```

Internal logic of `sendSummaryEmailForUser`:
1. Load user (email, display_name).
2. Query active contracts for spending total and per-contract rows using the same SQL as `DashboardService` (extract the `MONTHLY_FACTOR_SQL` constant to a shared location or duplicate with a clear comment).
3. Query upcoming renewals using the same logic as `DashboardService.getUpcomingRenewals` (reuse or call `DashboardService`).
4. Determine `ctaState`:
   - `cancellation-due` if `upcomingRenewals.length > 0` AND at least one has `daysUntilCancellationDeadline <= 0` **OR** treat all results from `getUpcomingRenewals` as cancellation-due (they are already filtered to be within the notice window).
   - `no-contracts` if `contracts.length === 0` AND ctaState is not already `cancellation-due`.
   - `none` otherwise.
5. Apply anonymization: replace `name` with `'––––'` where `anonymize === true`.
6. Call `mailer.sendSummaryEmail(userEmail, payload)`.

**Tests (write first)**:
- User with no contracts → `ctaState = 'no-contracts'`
- User with upcoming renewals → `ctaState = 'cancellation-due'`
- User with contracts, no upcoming renewals → `ctaState = 'none'`
- Anonymized contract name → replaced with placeholder
- `sendSummaryEmails('WEEKLY')` → only calls mailer for users with frequency='WEEKLY' and enabled=1
- `sendSummaryEmails('MONTHLY')` → only calls mailer for users with frequency='MONTHLY' and enabled=1
- Mailer failure → error is logged, does not throw (other users still processed)

---

### Step 5 — Mailer: `sendSummaryEmail()`

Add `sendSummaryEmail(data: SummaryEmailData): Promise<void>` to `MailerService` in `packages/backend/src/services/mailer.service.ts`.

Produces both plain-text and HTML versions. HTML: a simple table for contracts, bulleted list for renewals, a CTA block when applicable, a link `<a href="${data.dashboardUrl}">Go to Dashboard</a>`, and a footer note directing the user to Account Settings to change their email preferences.

**Tests (write first)**:
- `packages/backend/src/services/__tests__/mailer.service.test.ts`:
  - Subject line contains "weekly" or "monthly" based on frequency
  - HTML contains total spending value
  - HTML contains dashboard URL
  - HTML contains CTA text for `no-contracts` state
  - HTML contains CTA text for `cancellation-due` state
  - HTML does NOT contain anonymized contract name

---

### Step 6 — Scheduler service

New class `SchedulerService` in `packages/backend/src/services/scheduler.service.ts`.

```ts
import cron from 'node-cron';

class SchedulerService {
  constructor(private notification: NotificationService) {}

  /** Registers weekly (Mondays) and monthly (1st of month) cron jobs and starts them. */
  start(): void {
    cron.schedule('0 10 * * 1', () => this.notification.sendSummaryEmails('WEEKLY'),
      { timezone: 'UTC' });
    cron.schedule('0 10 1 * *', () => this.notification.sendSummaryEmails('MONTHLY'),
      { timezone: 'UTC' });
  }
}
```

**Tests (write first)**:
- `start()` does not throw (smoke test; actual cron ticks are not simulated in unit tests — see Quickstart step 5 for integration verification).
- Optionally: mock `cron.schedule` and assert it was called with the correct expressions and timezone.

---

### Step 7 — Profile routes (API)

Add to `packages/backend/src/routes/profile.ts`:

#### `GET /api/profile/notification-preferences`

1. Read `summary_email_enabled` and `summary_email_frequency` from the `users` row for the authenticated user.
2. Call `computeNextSendAt(frequency)` if enabled.
3. Return `NotificationPreferences` JSON.

#### `PATCH /api/profile/notification-preferences`

1. Parse body with `UpdateNotificationPreferencesBodySchema.safeParse`.
2. On validation failure → 400.
3. Write columns to DB. When disabling: set `summary_email_frequency = NULL`.
4. Return 204.

**Tests (write first)** — `packages/backend/src/routes/__tests__/profile.test.ts`:
- GET returns default disabled state for new user
- PATCH enabled=true + frequency='WEEKLY' → 204; GET returns updated values + nextSendAt
- PATCH enabled=false → 204; GET returns disabled state, nextSendAt=null
- PATCH enabled=true without frequency → 400
- PATCH unknown frequency → 400
- Unauthenticated GET → 401
- Unauthenticated PATCH → 401

---

### Step 8 — Wire scheduler in server entry point

In `packages/backend/src/index.ts`, after `server.listen(...)`:

```ts
if (mailer) {
  const notificationService = new NotificationService(db, mailer, process.env['APP_URL'] ?? 'http://localhost:5173');
  const scheduler = new SchedulerService(notificationService);
  scheduler.start();
}
```

Scheduler is only started when SMTP is configured, consistent with the existing mailer guard.

---

### Step 9 — Frontend hook

New file `packages/frontend/src/hooks/useNotificationPreferences.ts`:

```ts
// useNotificationPreferences(): { data, isLoading, updatePreferences, isPending }
```

Uses `@tanstack/react-query`:
- `useQuery(['notification-preferences'], GET /api/profile/notification-preferences)`
- `useMutation(PATCH /api/profile/notification-preferences, { onSuccess: invalidate query })`

**Tests (write first)** — `packages/frontend/src/hooks/__tests__/useNotificationPreferences.test.ts`:
- `data` shape matches `NotificationPreferences` type when API returns 200
- `updatePreferences` calls PATCH and invalidates query on success

---

### Step 10 — AccountSettings UI

Modify `packages/frontend/src/pages/AccountSettings.tsx` to add a **Summary Email** section below the existing notification content (or as a new card).

Section layout:
1. **Toggle** (Mantine `Switch`): "Send me a periodic contract summary email" — `summaryEmailEnabled`
2. **Frequency selector** (Mantine `SegmentedControl` or `Select`): "Weekly" | "Monthly" — visible and required only when toggle is on
3. **Next send info** (Mantine `Text`, muted): "Next email: [formatted date + time] UTC" — visible only when toggle is on
4. **Save button** — calls `updatePreferences`; shows success toast on 204

The `nextSendAt` ISO string is formatted for display using the existing `useLocaleFormat` hook or `Intl.DateTimeFormat` with `timeZone: 'UTC'`.

**Tests (write first)** — `packages/frontend/src/pages/__tests__/AccountSettings.test.tsx`:
- Summary Email section renders with toggle off by default
- Enabling toggle shows frequency selector and hides it when disabled
- Next send datetime is displayed when enabled
- Save triggers mutation with correct payload
- Frequency selector is hidden when toggle is off

---

### Step 11 — i18n

Add translation keys to both `packages/frontend/src/i18n/locales/en.json` and `de.json`:

```json
{
  "settings.summaryEmail.title": "Summary Email",
  "settings.summaryEmail.toggle": "Send me a periodic contract summary email",
  "settings.summaryEmail.frequency": "Frequency",
  "settings.summaryEmail.weekly": "Weekly",
  "settings.summaryEmail.monthly": "Monthly",
  "settings.summaryEmail.nextSend": "Next email: {{datetime}} UTC",
  "settings.summaryEmail.saved": "Email preferences saved"
}
```

---

### Step 12 — Documentation

Update after implementation:
- `README.md` and `README.de.md` — add summary email feature description
- `docs/user-guide.md` and `docs/user-guide.de.md` — document how to enable/disable, choose frequency, and read the next send datetime

## Complexity Tracking

No constitution violations. No entry required.
