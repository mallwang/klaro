# Research: Account Settings Page Restructure

**Date**: 2026-06-15

## Summary

No significant unknowns exist for this feature. The entire change lives within the frontend
React layer of an existing, well-understood codebase. The decisions below are confirmations of
the approach rather than open questions.

---

## Decision 1: Implementation approach — inline section headings vs. extracted components

**Decision**: Add `<Title order={3}>` headings inline inside the existing `<Stack>` hierarchy.
Do not extract new sub-components.

**Rationale**: Two heading elements do not justify a new component abstraction (Principle III).
Inline headings are consistent with the existing code style in `AccountSettings.tsx` (which
already uses inline `<Title>` for the page title).

**Alternatives considered**:
- Extract `<SettingsSection>` wrapper component — rejected because it would be used in exactly
  one place and adds an indirection without benefit.

---

## Decision 2: Visual separation between sections

**Decision**: Use a Mantine `<Divider>` or a generous `gap` value on the outer `<Stack>` to
visually separate the two sections without adding extra wrappers.

**Rationale**: The current page already uses `<Stack gap="lg">` between `<Paper>` cards. A
slightly larger gap (or an explicit `<Divider my="xl">`) between the two sections provides
sufficient visual distinction without additional DOM structure (Principle III).

**Alternatives considered**:
- Wrapping each section in a second `<Paper>` container — rejected because it would add
  visual weight (nested cards) that Mantine's own design guidelines advise against.
- Adding a coloured divider line — acceptable but not necessary; a plain `<Divider>` suffices.

---

## Decision 3: i18n keys for section headings

**Decision**: Add two new top-level i18n keys:

- `accountSettings.emailSettingsSectionTitle` → `"Email Settings"` / `"E-Mail-Einstellungen"`
- `accountSettings.accountSectionTitle` → `"Account"` / `"Konto"`

**Rationale**: Nesting under `accountSettings` keeps all account-settings strings together and
matches the existing key structure. Single-word group names are sufficient for unambiguous
labelling.

**Alternatives considered**:
- Top-level keys (`emailSettingsSection`, `accountSection`) — inconsistent with how all other
  account-settings strings are namespaced.

---

## Decision 4: Test strategy

**Decision**: Add one new describe block to `AccountSettings.test.tsx` before implementing
the JSX change. The test asserts that both section headings (`/email settings/i` and
`/account/i`) are rendered by the component. All existing tests remain unmodified.

**Rationale**: Principle I requires a failing test before implementation. The heading text is
the only new observable behaviour; no existing test currently checks for it.

**Alternatives considered**:
- Writing a separate test file — unnecessary overhead for two assertions.
- Relying solely on existing tests — does not satisfy TDD: no test would fail if the headings
  were accidentally omitted.
