# Data Model: FAQ Section

**Feature**: 032-faq-section | **Date**: 2026-06-16

## Entities

### FaqEntry

A single question/answer pair displayed in the accordion.

| Field      | Type   | Constraints                          | Notes                                  |
|------------|--------|--------------------------------------|----------------------------------------|
| `question` | string | Non-empty, max ~120 chars (soft)     | Displayed as the accordion item header |
| `answer`   | string | Non-empty, multi-sentence prose      | Displayed as the accordion item body   |

There is no explicit `key` field in the JSON; the array index is used as the React list key and as the Mantine `Accordion.Item` value (e.g., `"item-0"`).

### TypeScript type (frontend)

```ts
interface FaqEntry {
  question: string;
  answer: string;
}
```

This type is used only within the `Faq.tsx` page component; it does not need to be in the shared package.

---

## i18n JSON Schema

Both `en.json` and `de.json` are extended with the following structure. The `items` array must have the same number of entries in both files.

```jsonc
{
  // ... existing keys ...
  "faq": {
    "title": "Frequently Asked Questions",
    "items": [
      { "question": "Lorem ipsum dolor sit amet?", "answer": "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      // ... up to 10 entries ...
    ]
  }
}
```

**Access pattern** (in component):

```ts
const { t } = useTranslation();
const items = t('faq.items', { returnObjects: true }) as FaqEntry[];
```

---

## State

The FAQ page is stateless from the application's perspective. Mantine's `Accordion` component manages its own expand/collapse state internally. No server data, no loading states, no mutations.

---

## Validation Rules

- `items` array: 1–10 entries (soft upper bound; no runtime enforcement needed — content is static).
- Both language files must have equal-length `items` arrays (enforced by convention, not by code).
- Graceful fallback: if `t('faq.items', { returnObjects: true })` returns a non-array (e.g., due to a missing key), the component renders an empty list without crashing (guarded by `Array.isArray(items)` check).
