# Implementation Plan: FAQ Section

**Branch**: `032-faq-section` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-faq-section/spec.md`

## Summary

Add a dedicated FAQ page to the frontend application. The page follows the Mantine "faq-with-image" layout (accordion on one side, decorative image on the other) and displays content from language-specific JSON translation files, leveraging the existing i18next infrastructure so that language switching works automatically. Content maintainers edit only the translation files — no UI code changes are required to update questions or answers.

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), Node.js LTS (≥24)

**Primary Dependencies**: React 18, Vite 8, Mantine v7 (`@mantine/core`, `@mantine/hooks`), `@tabler/icons-react`, i18next + react-i18next, react-router-dom v7

**Storage**: N/A — content is static, bundled at build time via JSON translation files

**Testing**: Vitest + @testing-library/react (unit/component); Playwright (E2E)

**Target Platform**: Web browser (desktop and mobile, same breakpoints as rest of app)

**Project Type**: Web application (React frontend + Fastify backend monorepo — this feature is frontend-only)

**Performance Goals**: Page load indistinguishable from other static pages; no new network requests introduced

**Constraints**: Must not introduce new npm packages; must work within the existing Mantine v7 component set; content files must remain human-editable without build tools or specialist knowledge

**Scale/Scope**: 1 new page, 1 new route, 1 new nav entry, additions to 2 i18n JSON files — frontend package only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Test-First (NON-NEGOTIABLE)

**Status**: PASS (plan enforces it)

- A Vitest component test for `Faq.tsx` must be written and verified to fail before the component is implemented.
- The test asserts: FAQ page renders, accordion items are present for each content entry, clicking an item expands its answer.
- A Playwright E2E test must verify navigation to `/faq` and accordion interaction.

### Principle II — Type Safety (NON-NEGOTIABLE)

**Status**: PASS (plan enforces it)

- The `FaqEntry` type (key, question, answer) must be defined in a shared or local types file with no `any`.
- The translation accessor for FAQ content must be typed; the i18n JSON shape for the `faq` namespace will be reflected in i18next's type declarations.

### Principle III — Simplicity (YAGNI)

**Status**: PASS

- No abstraction beyond a single page component plus content in existing JSON files.
- The Mantine `Accordion` is used directly from the existing `@mantine/core` dependency — no wrapper abstraction.
- No backend changes, no new packages, no custom hooks.

## Project Structure

### Documentation (this feature)

```text
specs/032-faq-section/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── assets/
│   │   └── faq-image.svg          # Decorative illustration (downloaded from Mantine UI example)
│   ├── pages/
│   │   ├── Faq.tsx                # New: FAQ page component
│   │   └── index.ts               # Updated: export Faq
│   └── i18n/
│       └── locales/
│           ├── en.json             # Updated: add "faq" section
│           └── de.json             # Updated: add "faq" section
├── src/
│   ├── components/
│   │   └── AppShell/
│   │       └── NavbarSegmented.tsx # Updated: add FAQ nav link
│   └── main.tsx                    # Updated: add /faq route
└── src/
    └── pages/
        └── __tests__/
            └── Faq.test.tsx        # New: Vitest component tests
```

**Structure Decision**: Frontend-only change within the existing `packages/frontend` package. All content lives in the established `i18n/locales/` JSON files. No new package or directory is created beyond the page file, its test, and the image asset.
