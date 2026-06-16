# Quickstart & Validation Guide: FAQ Section

**Feature**: 032-faq-section | **Date**: 2026-06-16

## Prerequisites

- Node.js ≥ 24 and pnpm ≥ 10 installed
- Repository cloned and dependencies installed: `pnpm install`
- Backend running (for auth): `pnpm --filter backend dev`

---

## Validation Scenario 1 — FAQ Page Renders in English

1. Start the frontend dev server: `pnpm --filter frontend dev`
2. Sign in to the application.
3. Observe the sidebar — a "FAQ" link should be present in the app navigation.
4. Click the "FAQ" link or navigate to `http://localhost:5173/faq`.

**Expected**: The FAQ page loads showing:
- A decorative image on the left (or above on mobile).
- A heading "Frequently Asked Questions" (or equivalent English heading).
- An accordion list of up to 10 closed questions.

---

## Validation Scenario 2 — Accordion Expand / Collapse

1. On the FAQ page, click any question in the accordion.

**Expected**: The answer for that question expands below it.

2. Click the same question again.

**Expected**: The answer collapses.

3. Click a different question.

**Expected**: That question's answer expands (other items may collapse depending on Mantine `Accordion` mode — default is `multiple` or `single`; verify against the implemented behaviour).

---

## Validation Scenario 3 — German Language

1. Switch the application language to German (via account settings or language toggle).
2. Navigate to the FAQ page.

**Expected**: All questions and answers are displayed in German. The page heading is the German translation.

3. Switch back to English.

**Expected**: Content reverts to English without a page reload.

---

## Validation Scenario 4 — Content Maintainability

1. Open `packages/frontend/src/i18n/locales/en.json`.
2. Locate the `faq.items` array and change the `question` field of the first entry to `"Test question updated"`.
3. Save the file (Vite HMR refreshes automatically).
4. Observe the FAQ page in the browser.

**Expected**: The first question now reads "Test question updated".

5. Revert the change.

---

## Validation Scenario 5 — Mobile Responsive Layout

1. Open browser DevTools and switch to a mobile viewport (≤ 600 px wide).
2. Navigate to `/faq`.

**Expected**: The image stacks above the accordion (single-column layout). No horizontal overflow or broken layout.

---

## Automated Test Commands

```bash
# Unit / component tests
pnpm --filter frontend test

# Run only FAQ tests
pnpm --filter frontend test Faq

# End-to-end tests (requires both backend and frontend running)
pnpm --filter frontend test:e2e
```

**Expected**: All tests pass with no errors or warnings. The `Faq.test.tsx` tests cover:
- Renders FAQ items from mocked translation data.
- Accordion items are present and labelled with question text.
- Clicking an item triggers expand (via accessible role queries).
- Returns empty list gracefully when `faq.items` translation key is missing.

---

## References

- Content schema: [data-model.md](./data-model.md)
- Architecture decisions: [research.md](./research.md)
- Mantine Accordion API: https://mantine.dev/core/accordion/
- i18next `returnObjects`: https://www.i18next.com/translation-function/objects-and-arrays
