# Feature Specification: Contract Export and Import

**Feature Branch**: `011-export-import`

**Created**: 2026-06-06

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export All Contracts to File (Priority: P1)

A user wants to download all their contracts as a file — either Excel or JSON — so they can back
up their data, share it, or analyze it in a spreadsheet tool. The exported file uses the exact
database field names as column headers (Excel) or object keys (JSON), making it suitable for
re-importing later without any mapping step.

**Why this priority**: Backup/export is self-contained, delivers immediate value, and is the
foundation that makes round-trip import possible.

**Independent Test**: Can be tested by triggering an export from the UI, opening the downloaded
file, and verifying that it contains all contracts with the correct field names and values.

**Acceptance Scenarios**:

1. **Given** the user has at least one contract, **When** they choose "Export to Excel", **Then** a `.xlsx` file downloads containing one row per contract with exact database field names as headers.
2. **Given** the user has at least one contract, **When** they choose "Export to JSON", **Then** a `.json` file downloads containing an array of contract objects with exact database field names as keys.
3. **Given** the user has no contracts, **When** they trigger an export, **Then** the file downloads with only headers (Excel) or an empty array (JSON), without error.
4. **Given** a contract has a `cancellationPeriod` (e.g., 3 months), **When** exported to Excel, **Then** the period appears in two columns: `cancellationPeriod.value` and `cancellationPeriod.unit`.
5. **Given** a contract has a `cancellationPeriod`, **When** exported to JSON, **Then** it appears as a nested object `{ "value": 3, "unit": "MONTHS" }`.

---

### User Story 2 - Import Contracts from a File with Automatic Column Mapping (Priority: P2)

A user has a spreadsheet or JSON file with contract data whose column names don't exactly match
the database field names — for example columns called "Contract Name", "Provider", "Monthly Cost",
or "Start Date". The system analyses the file, infers which column corresponds to which database
field, and shows the user a mapping preview before importing. After the user confirms, the
contracts are created.

**Why this priority**: Import is more complex and depends on the data model established by P1,
but is the feature's main differentiator — removing the need for manual column renaming.

**Independent Test**: Can be tested by uploading a file with non-standard column headers, verifying
the system proposes a sensible mapping, confirming it, and checking that new contracts appear in
the contract list with the correct data.

**Acceptance Scenarios**:

1. **Given** a file with column "Contract Name", **When** the user uploads it, **Then** the system maps it to the `name` field.
2. **Given** a file with columns "Monthly Cost" and "Billing Frequency", **When** the user uploads it, **Then** the system maps them to `amount` and `billingInterval` respectively.
3. **Given** a file with a column the system cannot map confidently, **When** the system shows the mapping preview, **Then** that column is marked "Unmapped" and the user can manually assign or skip it.
4. **Given** the user reviews the mapping preview, **When** they confirm, **Then** the system creates one new contract per valid row.
5. **Given** a row has invalid data (e.g., a date in an unrecognised format), **When** import runs, **Then** that row is skipped and the user is shown an error summary listing which rows failed and why.

---

### User Story 3 - Correct the Mapping Before Importing (Priority: P3)

On the mapping preview screen, the user can override any auto-mapped column — for example if the
system mapped "Provider" to `details` but the user wants to skip that column entirely. The user
can also ignore a column so it is not imported.

**Why this priority**: Manual override is a quality-of-life improvement on P2, not required for
a functional MVP import.

**Independent Test**: Can be tested by uploading a file where a mapping is incorrect, changing it
in the preview, and verifying that the final import reflects the manual correction.

**Acceptance Scenarios**:

1. **Given** the mapping preview is shown, **When** the user changes a field assignment for a column, **Then** the preview updates immediately.
2. **Given** the mapping preview is shown, **When** the user marks a column as "Skip", **Then** that column is excluded from the import.
3. **Given** a required field (`name`, `amount`, `billingInterval`, `category`) is left unmapped, **When** the user tries to confirm, **Then** the system blocks the import and highlights the missing required fields.

---

### Edge Cases

- What happens when the uploaded file contains duplicate column names?
- What happens when an Excel file has multiple sheets?
- What happens when the JSON file is not an array of objects (e.g., a single object or invalid JSON)?
- What happens when all rows in the file fail validation?
- What if an import file is very large (e.g., 10,000 rows)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide export actions for both Excel (`.xlsx`) and JSON (`.json`) formats.
- **FR-002**: Exported files MUST use exact database field names as column headers (Excel) or object keys (JSON).
- **FR-003**: Nested fields (specifically `cancellationPeriod`) MUST be flattened to `cancellationPeriod.value` and `cancellationPeriod.unit` in Excel exports, and preserved as a nested object in JSON exports.
- **FR-004**: System MUST accept `.xlsx` and `.json` files for import.
- **FR-005**: System MUST automatically infer the mapping from uploaded column names to database fields using case-insensitive matching and common synonym recognition.
- **FR-006**: System MUST display a mapping preview to the user before any contracts are created, showing: source column → target database field (or "Unmapped") for every column in the file.
- **FR-007**: Users MUST be able to override or skip any column mapping in the preview before confirming.
- **FR-008**: Required fields (`name`, `amount`, `billingInterval`, `category`) MUST be mapped before the user can confirm an import.
- **FR-009**: System MUST validate each row's data against the contract schema before creating it.
- **FR-010**: Import MUST only create new contracts; it MUST NOT overwrite or update existing contracts.
- **FR-011**: System MUST report an import summary after completion, listing: total rows, successfully imported, and skipped rows with their row numbers and error reasons.
- **FR-012**: A partial import (some rows succeed, some fail) MUST be accepted — successfully validated rows are imported even if other rows fail.
- **FR-013**: Export MUST include all contracts regardless of the global anonymization toggle; the exported data always contains real field values.
- **FR-014**: System fields auto-managed by the system (`id`, `createdAt`, `updatedAt`) MUST be included in exports but MUST be ignored if present in an import file.

### Key Entities

- **Export File**: A downloadable file representing the full current contract dataset in a chosen format, using canonical database field names.
- **Column Mapping**: A correspondence table between source column names from the import file and target database field names; produced automatically and adjustable by the user.
- **Import Row**: A single record from the import file to be validated and, if valid, created as a contract.
- **Import Result**: A post-import summary showing total rows processed, contracts created, and rows skipped with error details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger an export and receive a downloaded file in under 5 seconds for datasets of up to 500 contracts.
- **SC-002**: At least 90% of columns in a file exported by this system and re-imported are automatically mapped correctly without user intervention.
- **SC-003**: Users can complete an import — from file selection through mapping confirmation to result summary — in under 3 minutes for a file of up to 100 rows.
- **SC-004**: Any row that fails validation produces a specific, human-readable error message identifying the row number and the problematic field.
- **SC-005**: The mapping preview is displayed to the user before any data is written, with zero exceptions.

## Assumptions

- Import always creates new contracts. Updating or deduplicating existing contracts is out of scope for this version.
- Only one sheet is processed during Excel import; if multiple sheets are present, the first sheet is used and the user is informed.
- The `anonymize` field is exported with its real value (true/false) and can be set via import; the export is considered a private operation by the user.
- The export includes all contracts the system holds, with no pagination or filtering applied at export time.
- Files larger than 5 MB may be rejected with a clear error message; this covers the expected personal-use scale of data.
- Enum values (`category`, `billingInterval`, `status`, `cancellationPeriod.unit`) must be supplied in the canonical uppercase form recognized by the system; the system normalises case during import but does not translate free-text synonyms for enum values.
- The feature is accessible from the contracts list page (e.g., via an "Import / Export" button or menu).
