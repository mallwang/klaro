# Feature Specification: Email Language Preference

**Feature Branch**: `024-email-language-preference`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "I would like to allow authenticated users to choose the language for email correspondence. In the account settings, there should be the option in which language email should be sent to the user. Emails should respect this setting to send any emails (email change, weekly/monthly status emails) to send the content in the respective language (includes also locale formatting of dates and currency). The email language should be independent from the selected browser language. Email templates must be available in every language the UI supports - they must also always be in sync (e.g. when a new UI language like italian will be added, then there must be italian email templates be created)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Email Language in Account Settings (Priority: P1)

An authenticated user opens their Account Settings page and selects the language in which they want to receive all future emails. The selection is saved per user and is completely independent of the browser language or the UI display language.

**Why this priority**: This is the foundational user-facing control for the entire feature. Without it, no other story can function. Delivers immediate, visible user value.

**Independent Test**: Can be fully tested by navigating to Account Settings, changing the email language to a supported locale, saving, and verifying the stored preference via the profile API — without sending any actual email.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Account Settings page, **When** they open the "Email Language" selector, **Then** all languages currently supported by the UI are listed as options.
2. **Given** a logged-in user, **When** they select a language and save, **Then** the preference is persisted and the selector reflects the chosen language on the next page load.
3. **Given** a logged-in user, **When** no email language has been explicitly set, **Then** the email language defaults to English (the first supported locale).
4. **Given** a logged-in user who has already set an email language, **When** they change it and save, **Then** the new value replaces the previous preference.

---

### User Story 2 - Receive Transactional Emails in Preferred Language (Priority: P2)

When a user triggers a transactional email (e.g. email-change confirmation), the email is delivered in the language the user has selected, with all dates and monetary amounts formatted according to the locale conventions of that language.

**Why this priority**: Core value delivery — the setting chosen in P1 must actually affect outgoing email content.

**Independent Test**: Can be tested by updating the email-language preference to German, then triggering an email-change flow, and verifying the received email is in German with locale-appropriate date/currency formatting.

**Acceptance Scenarios**:

1. **Given** a user whose email language is set to German, **When** they initiate an email address change, **Then** the confirmation email is written entirely in German.
2. **Given** a user whose email language is set to English, **When** they initiate an email address change, **Then** the confirmation email is written entirely in English.
3. **Given** an email that contains a date or monetary value, **When** the user's email language is German, **Then** dates follow the `DD.MM.YYYY` format and currency uses `.` as the thousands separator and `,` as the decimal separator.
4. **Given** an email that contains a date or monetary value, **When** the user's email language is English, **Then** dates follow the `MM/DD/YYYY` format and currency uses `,` as the thousands separator and `.` as the decimal separator.

---

### User Story 3 - Receive Summary Emails in Preferred Language (Priority: P3)

Weekly and monthly contract summary emails are generated and sent in the language the user has selected, including locale-correct formatting of all contract dates and currency values.

**Why this priority**: Extends the language preference to scheduled/automated emails — important for non-transactional communication but depends on P1 and P2 being in place first.

**Independent Test**: Can be tested by setting email language to German for a user with contracts, triggering a summary email via the backend script, and verifying the output is German with correct locale formatting.

**Acceptance Scenarios**:

1. **Given** a user whose email language is set to German, **When** the weekly/monthly summary email is generated for that user, **Then** all text, labels, and headings are in German.
2. **Given** a user whose email language is set to English, **When** the weekly/monthly summary email is generated, **Then** all text, labels, and headings are in English.
3. **Given** summary emails listing contract renewal dates and costs, **When** the user's email language is German, **Then** all amounts and dates use German locale formatting.
4. **Given** a user with no explicit email language preference set, **When** any email is sent to them, **Then** the email is delivered in English.

---

### User Story 4 - Email Templates Kept in Sync Across Languages (Priority: P4)

When a new UI language is added to the application, corresponding email templates for that language must exist for every email type before the language is considered fully supported. The absence of templates for a supported UI language is treated as a defect.

**Why this priority**: This is a governance/consistency story — it prevents silent degradation where new UI languages ship without matching email support.

**Independent Test**: Can be tested by an automated check that compares the list of supported UI locales against the list of locales for which every email template exists, and asserts no gaps.

**Acceptance Scenarios**:

1. **Given** the set of UI-supported languages, **When** a CI check runs, **Then** every email template type has a corresponding file for every supported language.
2. **Given** a new UI language is added, **When** the developer attempts to merge without adding all matching email templates, **Then** the CI check fails and blocks the merge.
3. **Given** all templates exist for all supported languages, **When** the CI check runs, **Then** it passes with no errors.

---

### Edge Cases

- What happens when a user's stored email language no longer exists (e.g. a previously supported locale was removed)? The system falls back to English without error.
- What if the email template for a given language is missing at send time? The system falls back to the English template and logs a warning.
- Does changing the UI display language affect the email language preference? No — these settings are fully independent.
- What happens when an admin sends a system email to a user who has never logged in and has no preference? The email is sent in English.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Account Settings page MUST include a dedicated "Email Language" selector that lists all languages currently supported by the UI.
- **FR-002**: The email language preference MUST be stored per user and persisted across sessions.
- **FR-003**: The email language preference MUST be independent of the browser language and the UI display language — changing one MUST NOT affect the other.
- **FR-004**: All outgoing emails (transactional and scheduled) MUST be rendered using the template corresponding to the recipient user's stored email language preference.
- **FR-005**: All dates and monetary values inside emails MUST be formatted according to the locale conventions of the user's selected email language.
- **FR-006**: When a user has no email language preference set, the system MUST default to English for all outgoing emails.
- **FR-007**: When a stored email language is no longer supported, the system MUST fall back to English without surfacing an error to the user.
- **FR-008**: When a matching email template is missing at send time, the system MUST fall back to the English template and log a warning.
- **FR-009**: Every email type MUST have a corresponding template for every language supported by the UI — gaps MUST be detected by an automated check in CI.
- **FR-010**: The automated template coverage check MUST fail CI when any email template is absent for any supported UI language.

### Key Entities

- **User Email Language Preference**: A per-user setting that stores the chosen locale code (e.g. `en`, `de`). Belongs to the user's profile/account record. Defaults to `en` when absent.
- **Email Template**: A versioned content artifact for a specific email type and locale. Identified by email type + locale code. The set of email types and the set of supported locales are the axes; every cell in that matrix must be filled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate, change, and save their email language preference within Account Settings in under 30 seconds.
- **SC-002**: 100 % of outgoing emails are sent in the recipient's stored language preference (or English as fallback) — zero emails are sent in the wrong language due to a system error.
- **SC-003**: All date and currency values in emails match the locale formatting rules of the selected language with zero formatting inconsistencies.
- **SC-004**: The CI template-coverage check catches any missing email template within 1 CI run, preventing an incomplete locale from reaching production.
- **SC-005**: Adding a new UI language requires only one additional step visible to developers — creating the missing email templates — and the CI check guides exactly which templates are needed.

## Assumptions

- The UI currently supports exactly two languages: English (`en`) and German (`de`). The feature is designed to scale to additional languages but must cover these two at launch.
- The existing `AccountSettings` page is the correct and sole location for the email language preference control; no additional settings screen is needed.
- The email language preference is stored as a locale code string on the user's profile record in the database.
- The backend already has a mailer service and email templates; these will be extended with per-language variants rather than replaced.
- Summary emails are sent via a backend script (`send-summary-email.ts`) that processes all eligible users — the script will look up each user's preference individually.
- Locale formatting for dates and currency will use the same locale code (e.g. `de`, `en`) without requiring region-specific sub-codes (e.g. `de-DE`, `en-US`).
- The automated template-coverage check will be implemented as a CI step (or test) rather than a runtime guard, keeping the production code path simple.
