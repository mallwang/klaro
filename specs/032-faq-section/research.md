# Research: FAQ Section

**Feature**: 032-faq-section | **Date**: 2026-06-16

## Decision 1: FAQ Content Storage

**Decision**: Store FAQ question/answer content inside the existing `i18n/locales/en.json` and `de.json` translation files under a top-level `faq` key, as a JSON array of objects.

**Rationale**: The application already uses i18next + react-i18next for all UI text. Adding FAQ content to the same files means language switching works automatically without any custom logic. The `useTranslation` hook returns typed values, content editors already know the file format, and there is no new mechanism to maintain.

**Alternatives considered**:
- Separate TypeScript data files per language (`faq/en.ts`, `faq/de.ts`): Would require a custom language-selection function to pick the right file at runtime — extra code with no benefit over the i18n approach.
- A single file with nested language keys (`{ en: [...], de: [...] }`): Couples both languages in one file, making concurrent edits harder and growing unwieldy as content expands.
- Markdown files parsed at build time: Over-engineering; markdown parsing adds build complexity for a small number of plain-text Q&A entries.

---

## Decision 2: i18n JSON Structure for FAQ Entries

**Decision**: Use an array of objects with `question` and `answer` string fields, nested under a `faq.items` key. A `faq.title` key holds the section heading.

```json
"faq": {
  "title": "Frequently Asked Questions",
  "items": [
    { "question": "...", "answer": "..." },
    ...
  ]
}
```

**Rationale**: i18next supports array resources natively via the `returnObjects: true` option (or the `t('faq.items', { returnObjects: true })` call). The flat structure (no nested keys per item) keeps the JSON easy to scan and edit. A maintainer adds an entry by appending one object to the array.

**Alternatives considered**:
- Numbered keys (`faq.q1`, `faq.a1`, `faq.q2`, …): Fragile when reordering; maintainers must keep `qN`/`aN` pairs in sync manually.
- Keyed objects (`faq.items.billing.question`, `faq.items.billing.answer`): Useful when entries need to be referenced individually across the app; unnecessary here since FAQ items are only consumed as a list.

---

## Decision 3: Mantine UI Layout Component

**Decision**: Use `SimpleGrid` with two columns (image column + accordion column) wrapping a Mantine `Accordion` with `chevronPosition="right"`. This matches the Mantine "faq-with-image" showcase example exactly.

**Rationale**: All required Mantine components (`Accordion`, `SimpleGrid`, `Image`, `Title`, `Container`, `Text`) are already available in `@mantine/core` v7, which is an existing dependency. No new packages are needed.

**Alternatives considered**:
- CSS Grid via CSS modules: Works but duplicates layout logic already solved by Mantine's `SimpleGrid` responsive breakpoints.
- Mantine `Grid` (column-based): More verbose for a two-column layout; `SimpleGrid` with `cols={{ base: 1, sm: 2 }}` is simpler.

---

## Decision 4: Decorative Image Asset

**Decision**: Download the SVG illustration used in the Mantine "faq-with-image" showcase from the `@mantinedev/mantine.dev` repository and bundle it as a static asset at `packages/frontend/src/assets/faq-image.svg`.

**Rationale**: The user explicitly approved using the example image. Bundling as a local SVG asset avoids an external HTTP dependency at runtime and keeps the app self-contained. SVGs scale cleanly across all viewport sizes.

**Alternatives considered**:
- Reference the image via a CDN URL: Creates a runtime external dependency; image could disappear or change.
- Use a generic placeholder icon from `@tabler/icons-react`: Less visually distinctive; user specifically requested the Mantine example look.

---

## Decision 5: Navigation Placement

**Decision**: Add a "FAQ" link to the `appLinks` array in `NavbarSegmented.tsx`, using `IconQuestionMark` (or `IconHelp`) from `@tabler/icons-react`. Route path: `/faq`.

**Rationale**: All app-level navigation links live in `appLinks`; the FAQ is a non-admin, informational page appropriate for the app segment. `@tabler/icons-react` is an existing dependency.

**Alternatives considered**:
- Footer link only: Would not satisfy FR-001 ("accessible from the main navigation").
- Help icon in the app-shell header: Non-standard placement for this app; sidebar nav is the established pattern.
