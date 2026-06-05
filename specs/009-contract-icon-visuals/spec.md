# Feature Specification: Contract Icon Visuals

**Feature Branch**: `009-contract-icon-visuals`

**Created**: 2026-06-05

**Status**: Draft

**Input**: User description: "I would like to enhance the visuals a bit for contract information. The idea is to show both icons for the contract category and, which is more fancy, show the contract provider icons after the user entered its name. Maybe there are some open source sources to automatically fetch them from the frontend during displaying. If not available on the searched source, then a fallback icon should be displayed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Category Icons in All Contract Views (Priority: P1)

A user browsing their contracts can immediately identify the category of each contract at a glance through a distinct category icon. The icon appears wherever contract information is displayed — the contract list, contract cards, and the contract detail view.

**Why this priority**: Category icons are a pure display enhancement with no external dependencies. They deliver immediate visual clarity and are the foundation for the overall icon system in this feature.

**Independent Test**: Can be fully tested by viewing the contracts list and detail page with at least one contract per category; each contract should display a distinct, recognizable icon matching its category.

**Acceptance Scenarios**:

1. **Given** a user views the contracts list, **When** the list renders, **Then** each contract row displays an icon that visually represents its category.
2. **Given** a user opens a contract's detail view, **When** the detail renders, **Then** the contract's category is represented by a corresponding icon.
3. **Given** two contracts with different categories, **When** they are displayed side by side, **Then** they show visually distinct icons.
4. **Given** a contract category that has no icon mapping defined, **When** that contract is displayed, **Then** a generic/default icon is shown instead of a broken or missing icon.

---

### User Story 2 - Automatic Provider Logo Display (Priority: P2)

A user who has entered a provider name (e.g., "Netflix", "Spotify", "Amazon") for a contract sees the provider's logo or brand icon displayed alongside the provider name in all contract views. The logo is fetched automatically from a publicly accessible free source without any extra action from the user.

**Why this priority**: Provider logos make contracts instantly recognizable and give the app a polished, professional feel. It depends on the provider name being set, making it a secondary enhancement over category icons.

**Independent Test**: Can be fully tested by viewing a contract whose provider name matches a well-known company; the provider's logo should appear adjacent to the provider name.

**Acceptance Scenarios**:

1. **Given** a contract with a provider name that corresponds to a known company, **When** the contract is displayed in the list or detail view, **Then** the provider's logo or icon is shown next to the provider name.
2. **Given** a user creates or edits a contract and enters a provider name, **When** they have finished entering the provider name, **Then** a logo appears in the form for that provider if one can be resolved.
3. **Given** a contract with a provider name that cannot be resolved to a logo, **When** the contract is displayed, **Then** a generic fallback icon is shown in place of the logo.
4. **Given** a contract with no provider name entered, **When** the contract is displayed, **Then** no provider logo area is shown (or the area is hidden).
5. **Given** the external logo source is unavailable (network error or service down), **When** the contract is displayed, **Then** the fallback icon is shown without any error visible to the user.

---

### User Story 3 - Graceful Fallback for Unresolvable Logos (Priority: P1 within Story 2)

Any time a provider logo cannot be loaded — whether because the provider is unknown, the network is offline, or the source returns an error — the user sees a clean, generic company/provider icon immediately. There is no broken image, no loading spinner that never resolves, and no layout shift after the fallback is shown.

**Why this priority**: Fallback handling is non-negotiable for production quality. Without it, the logo feature actively harms the UI when logos cannot be found.

**Independent Test**: Can be tested by entering an obscure or fictional provider name (e.g., "LocalGym123") and confirming the fallback icon appears promptly and the layout remains stable.

**Acceptance Scenarios**:

1. **Given** a provider name that returns no logo from the external source, **When** the contract is displayed, **Then** a fallback icon is visible within 500ms without layout shift.
2. **Given** the device is offline, **When** the contract list is displayed, **Then** all provider logo slots show the fallback icon cleanly.
3. **Given** a provider logo initially fails to load, **When** it fails, **Then** the fallback icon replaces it immediately without a broken-image placeholder.

---

### Edge Cases

- What happens when a provider name contains special characters, numbers, or is in a non-Latin script?
- How does the system handle very long provider names that cannot be mapped to a domain?
- What if the same provider name resolves to different logos depending on the source (e.g., ambiguous short names)?
- What if a contract's category is deleted or renamed after icons are mapped to it?
- How does icon display behave on small screens or in narrow table columns?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a category-specific icon for each contract in the contract list, contract cards, and contract detail views.
- **FR-002**: Category icons MUST be visually distinct from one another across all defined contract categories.
- **FR-003**: When a contract's category has no mapped icon, the system MUST display a generic fallback icon rather than a blank or broken icon.
- **FR-004**: The system MUST automatically fetch and display a provider logo when a contract has a provider name entered, without requiring any user action beyond entering the name.
- **FR-005**: Provider logo fetching MUST occur client-side using a publicly accessible, free, open-source-compatible service.
- **FR-006**: Provider logos MUST be displayed in the contract list, contract detail view, and the contract create/edit form.
- **FR-007**: When a provider logo cannot be resolved (unknown provider, network error, or source unavailable), the system MUST display a generic provider fallback icon.
- **FR-008**: The fallback icon MUST appear within 500 milliseconds of a logo load failure.
- **FR-009**: No layout shift or visible broken-image indicator MUST occur when a provider logo fails to load.
- **FR-010**: Contracts with no provider name entered MUST NOT display a provider logo area.
- **FR-011**: The system MUST handle network failures for logo fetching gracefully, showing the fallback without surfacing error messages to the user.

### Key Entities

- **Contract**: Existing entity; gains two new visual attributes — a resolved category icon and an optionally resolved provider logo — derived from its `category` and `providerName` fields respectively.
- **Category Icon Mapping**: A mapping from each defined contract category value to a corresponding icon; includes a default entry for unmapped categories.
- **Provider Logo**: A dynamically fetched visual asset resolved at display time from the provider name; ephemeral (not stored), with a defined fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every contract displayed in the list or detail view shows a category icon — 0 contracts rendered without an icon (fallback counts as fulfillment).
- **SC-002**: Provider logos for commonly known companies (e.g., top 100 global consumer brands) load and display correctly in at least 80% of cases.
- **SC-003**: Fallback icons appear within 500ms of a logo failure, with no visible broken image or layout shift at any point.
- **SC-004**: The addition of icons produces no measurable increase in time-to-interactive for the contracts list page (within ±200ms tolerance of baseline).
- **SC-005**: Users can identify a contract's category from its icon alone without reading the category label, as confirmed by informal usability testing with at least 3 users recognizing icons correctly.

## Assumptions

- All currently defined contract categories will receive a corresponding icon mapping; no category will be left without at least a fallback icon.
- Provider logo fetching is performed entirely on the client side; no backend proxy or server-side caching is required for the initial implementation.
- The provider name field in the contract data is a plain text string representing a company or service name (e.g., "Netflix", "ADAC").
- Icons are displayed at small-to-medium sizes (approximately 24px–48px) within the existing UI layout and do not require large high-resolution assets.
- The existing UI already has an icon library installed (assumed from prior feature work); category icons will use that library.
- Mobile responsiveness of existing views is maintained after icons are added.
- No user preference or toggle is required to enable/disable icons — they are always shown.
- The external provider logo service does not require authentication or API keys for basic usage.
