# Research: Scheduled Summary Email

## 1. Scheduler Implementation

**Decision**: Add `node-cron` (v3) as a backend dependency.

**Rationale**: The app is self-contained (Docker) and currently has no external scheduler. `node-cron` parses standard cron expressions, runs entirely in-process, and adds zero transitive dependencies. The weekly trigger uses `0 10 * * 1` (Mondays 10:00); the monthly trigger uses `0 10 1 * *` (1st of month 10:00). Cron expressions run in the Node.js process timezone — the scheduler will be configured to use UTC explicitly via the `timezone: 'UTC'` option supported by `node-cron` v3.

**Alternatives considered**:
- **`setInterval` loop with manual time checks** — no new dependency, but requires bespoke drift-correction logic and is harder to test.
- **OS-level cron / Docker entrypoint script** — decouples scheduling from the app, but requires additional ops configuration that contradicts the single-container deployment model.
- **`node-schedule`** — similar to `node-cron` but larger API surface than needed.

---

## 2. User Preference Storage

**Decision**: Add two columns directly to the existing `users` table (`summary_email_enabled`, `summary_email_frequency`) via the incremental migration pattern already in `client.ts`.

**Rationale**: The project constitution mandates YAGNI. A separate table would be justified if multiple independent preference categories existed; here there is exactly one setting group. Two columns on `users` is the simplest representation, matches the existing migration guard pattern (`PRAGMA table_info` checks), and requires no join on read.

**Columns**:
```sql
summary_email_enabled   INTEGER NOT NULL DEFAULT 0
summary_email_frequency TEXT    CHECK(summary_email_frequency IN ('WEEKLY','MONTHLY'))
```
`summary_email_frequency` is nullable; NULL is valid when `summary_email_enabled = 0`.

**Alternatives considered**:
- **Separate `notification_preferences` table** — cleaner separation of concerns but unnecessary complexity for a single boolean + enum setting.

---

## 3. Next Send Datetime Calculation

**Decision**: Compute the next send datetime on the backend and return it as part of the `GET /api/profile/notification-preferences` response (ISO 8601 UTC string).

**Formula**:
- **Weekly**: find the next Monday at 10:00 UTC. If today is Monday and current UTC time < 10:00, that is today; otherwise advance to next Monday.
- **Monthly**: find the 1st of the next month at 10:00 UTC. If today is the 1st and current UTC time < 10:00, that is today; otherwise use 1st of next month.
- **Disabled**: field is `null`.

**Rationale**: Centralising the calculation on the backend avoids timezone drift on the client and keeps the preference query the single source of truth for scheduling information.

---

## 4. Call-to-Action Logic

**Decision**: Three mutually exclusive CTA states evaluated in priority order:

1. `cancellation-due` — one or more active contracts are within their cancellation notice window (reuses the existing `DashboardService.getUpcomingRenewals` data). CTA prompts the user to check those contracts before the deadline.
2. `no-contracts` — user has zero active contracts. CTA motivates the user to add their first contract.
3. `none` — neither condition applies; no CTA is included in the email.

`cancellation-due` takes precedence over `no-contracts` per the spec assumption (a contract in the notice period is still an active contract, so in practice both cannot fire simultaneously — but the priority is documented defensively).

---

## 5. Email Composition

**Decision**: Add `sendSummaryEmail()` to `MailerService`, following the existing pattern of plain-text + HTML duals. No external templating engine (Handlebars, Mustache) is introduced — inline template literals are sufficient and consistent with the existing methods.

**Content sections**:
1. Greeting
2. Total monthly spending (formatted as currency)
3. Per-contract breakdown table (name anonymized where flagged, billing interval, monthly-equivalent cost)
4. Upcoming renewals (name, renewal date, days until cancellation deadline) — omitted if empty
5. Context-aware CTA block (omitted if state is `none`)
6. Dashboard link button/text
7. Footer (unsubscribe reminder pointing to Account Settings)

**Alternatives considered**:
- **Email templating library** — overkill for a handful of purpose-specific emails; would add a dependency without benefit given the small email surface area.

---

## 6. Anonymization in Email

**Decision**: Apply the same per-contract `anonymize` flag used in the dashboard. The `DashboardService.getUpcomingRenewals` and the summary query both already return the `anonymize` field. Anonymized contract names are replaced with a placeholder (e.g., "––––") in the email.

There is no "global anonymization toggle" persisted in the database — the global toggle is a client-side UI state only (stored in `localStorage`). Therefore the email applies only the per-contract `anonymize` flag from the database. This is the correct and only server-side signal available.
