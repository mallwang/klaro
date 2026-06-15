# Feature Specification: Scheduled Summary Email

**Feature Branch**: `023-summary-email`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "I would like to send a weekly/monthly summary email that lists the current spendings and the upcoming renewals to each user. The user should have the option in the settings to enable/disable the email and to choose between weekly and monthly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Summary Email Preferences (Priority: P1)

A user visits their account settings and controls whether they receive a summary email and how often. They can toggle the feature on or off and switch between weekly and monthly delivery. Their preferences take effect starting from the next scheduled send.

**Why this priority**: This is the prerequisite for all other stories — without a preference UI, the email cannot be meaningfully scoped per user.

**Independent Test**: Can be fully tested by navigating to account settings, toggling the email on, selecting a frequency, saving, and verifying the saved preferences are reflected upon returning to the settings page — delivers the complete preference management slice without any email being sent.

**Acceptance Scenarios**:

1. **Given** a logged-in user on their account settings page, **When** they enable the summary email and select "Weekly", **Then** the preference is saved and displayed correctly on the settings page.
2. **Given** a user who has previously enabled weekly emails, **When** they switch to "Monthly" and save, **Then** the preference is updated and the next email will follow the monthly schedule.
3. **Given** a user who has enabled summary emails, **When** they disable the feature and save, **Then** no further summary emails are sent to that user.
4. **Given** a newly created account, **When** the user opens account settings, **Then** the summary email feature is disabled by default.

---

### User Story 2 - Receive Weekly Summary Email (Priority: P2)

A user who has opted into weekly summary emails receives an email each Monday. The email shows their total monthly contract spending, a per-contract cost breakdown for active contracts, and a list of contracts whose renewal date falls within the next 30 days.

**Why this priority**: This is the core value delivery — the first concrete output the user sees from this feature.

**Independent Test**: Can be fully tested by enabling weekly emails in settings, triggering a test send (or advancing time), and verifying the received email content matches the user's current contract data.

**Acceptance Scenarios**:

1. **Given** a user with weekly emails enabled and at least one active contract, **When** the weekly send runs on Monday, **Then** the user receives an email with the correct total monthly spending and a per-contract breakdown.
2. **Given** a user with contracts renewing within 30 days, **When** the summary email is sent, **Then** those contracts appear in the "Upcoming Renewals" section with the renewal date and cost.
3. **Given** a user with no contracts renewing in the next 30 days, **When** the summary email is sent, **Then** the "Upcoming Renewals" section states that there are no upcoming renewals.
4. **Given** a contract marked as anonymized, **When** the summary email is generated, **Then** that contract's name is hidden/anonymized in the email consistent with the app's anonymization rules.
5. **Given** a user with weekly emails disabled, **When** the weekly send runs, **Then** that user does not receive any email.

---

### User Story 3 - Receive Monthly Summary Email (Priority: P3)

A user who has opted into monthly summary emails receives an email on the 1st of each month, with the same content structure as the weekly email.

**Why this priority**: Same value as the weekly email but for a different cadence; depends on the weekly email content structure being finalised first.

**Independent Test**: Can be fully tested independently by enabling monthly emails, triggering a monthly send, and verifying the email content and delivery.

**Acceptance Scenarios**:

1. **Given** a user with monthly emails enabled, **When** the monthly send runs on the 1st of the month, **Then** the user receives a summary email with accurate spending and renewal data.
2. **Given** a user with weekly emails enabled, **When** the monthly send runs, **Then** that user does NOT receive a monthly email (the two frequencies are mutually exclusive).

---

### Edge Cases

- What happens when a user has no active contracts? The email is still sent but shows zero total spending and no contracts in the breakdown; the upcoming renewals section is empty.
- What happens if a user changes their frequency setting between two scheduled sends? The next email follows the new frequency; no duplicate or missed send occurs.
- What happens if the user's email address is unverified or bounces? The delivery attempt is logged; no retry loop is triggered.
- How does the system handle anonymized contracts? Contract names are replaced with the anonymized placeholder, consistent with the in-app anonymization behaviour.
- What if the global anonymization toggle is active for a user? All contract names in the email are anonymized.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to enable or disable the summary email from their account settings page.
- **FR-002**: Users MUST be able to choose between "Weekly" and "Monthly" delivery frequency in their account settings.
- **FR-003**: The system MUST default to disabled for all users (opt-in only).
- **FR-004**: Summary emails MUST include the user's total monthly contract spending across all active contracts.
- **FR-005**: Summary emails MUST include a per-contract cost breakdown listing each active contract's name, billing interval, and monthly-equivalent cost.
- **FR-006**: Summary emails MUST include an "Upcoming Renewals" section listing contracts whose renewal date falls within the next 30 days, sorted by renewal date ascending.
- **FR-007**: Summary emails MUST respect per-contract anonymization flags and the global anonymization toggle — anonymized contract names MUST be hidden in the email.
- **FR-008**: Weekly summary emails MUST be dispatched every Monday.
- **FR-009**: Monthly summary emails MUST be dispatched on the 1st day of each month.
- **FR-010**: Weekly and monthly frequencies MUST be mutually exclusive — a user receives at most one email per scheduled send window.
- **FR-011**: Preference changes MUST take effect from the next scheduled send; no retroactive sends or cancellations.
- **FR-012**: Users with the summary email disabled MUST NOT receive any summary email regardless of the send schedule.

### Key Entities *(include if feature involves data)*

- **EmailSummaryPreference**: Per-user setting capturing whether the summary email is enabled and the chosen frequency (weekly or monthly). Belongs to one user; persisted alongside other notification preferences.
- **SummaryEmailPayload**: The computed content for a single user's email — total spending, per-contract breakdown rows, and upcoming renewal rows. Derived at send time from the user's live contract data; not stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate, change, and save their summary email preference in under 60 seconds on first use.
- **SC-002**: Summary emails are delivered within 1 hour of the scheduled send window (Monday 08:00 local server time for weekly; 1st of month 08:00 for monthly).
- **SC-003**: Email content matches the user's actual contract data at the moment of generation with 100% accuracy (correct totals, correct renewal dates).
- **SC-004**: Zero summary emails are sent to users who have the feature disabled or have no account email address on record.
- **SC-005**: Anonymization rules are honoured in 100% of generated emails — no anonymized contract name appears in plain text.

## Assumptions

- The project's existing email delivery infrastructure (introduced in feature 018-email-enhancements) is reused; no new email provider is introduced.
- "Current spendings" means the sum of all active contracts normalised to a monthly cost equivalent (matching the existing spending calculation used in the dashboard).
- "Upcoming renewals" means contracts whose next renewal date is within the next 30 calendar days from the send date.
- Weekly emails are dispatched on Monday; monthly emails on the 1st of the month. The specific time is 08:00 server time and is not user-configurable in v1.
- The summary email preference is stored per-user, independently of other notification preferences already in the system.
- Mobile push notifications and in-app notifications are out of scope; this feature covers email only.
- User timezone handling is out of scope for v1 — send times are based on server time.
- The email design reuses the project's existing email template/layout for visual consistency.
