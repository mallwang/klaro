## Documentation Requirements

### README Updates
After every implemented feature, **both** `README.md` (English) and `README.de.md` (German)
must be updated to reflect the new functionality. Updates must be consistent across both files.

### User guide updates
After every implemented feature, **both** `docs/user-guide.md` (English) and
`docs/user-guide.de.md` (German) must be updated to document the new functionality from a
user perspective — what the feature does, how to reach it, and any relevant edge cases
(e.g. blocking conditions like the sole-admin guard). Updates must be consistent across both
files.

### JSDoc
Every new function and every function whose implementation changes must carry a JSDoc comment.
Required structure:

```ts
/**
 * Short description of what the function does (one sentence, imperative mood).
 *
 * @param name - what this parameter represents
 * @returns what the return value represents
 *
 * Optional: one short paragraph explaining non-trivial logic — hidden constraints,
 * subtle invariants, or behavior that would surprise a reader. Omit if the
 * implementation is straightforward.
 */
```

Omit the optional details block when the function body is self-explanatory. Do not repeat
what well-named identifiers already express.

### File-level description
Every source file must begin with a file-level JSDoc block placed **after** the import
section and **before** the first class, function, or exported symbol:

```ts
/**
 * Brief description of what this module is responsible for.
 */
```

One or two sentences maximum. Describes the module's role, not its contents.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/021-forgot-password/plan.md
<!-- SPECKIT END -->
