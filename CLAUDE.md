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

## SonarCloud Code Quality

A SonarQube MCP server is configured for this project. Use it to check code quality after
making changes.

**Workflow when modifying code:**

1. Before starting implementation, disable SonarLint's automatic background analysis:
   call `mcp__sonarqube__toggle_automatic_analysis` (if the tool is available).
2. Implement the changes.
3. After finishing, analyze the files you created or modified:
   call `mcp__sonarqube__analyze_code_snippet` or look up existing issues with
   `mcp__sonarqube__search_sonar_issues_in_projects` (project key: `mallwang_personal-contract-management`).
4. Re-enable automatic analysis when done.

**Quality gate thresholds to enforce (matches SonarCloud project config):**
- Duplicated lines on new code: < 3 %
- No new bugs or security hotspots
- No new critical code smells

Use `mcp__sonarqube__get_project_quality_gate_status` to check overall gate status after a
CI scan has run on a branch or PR.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/024-email-language-preference/plan.md
<!-- SPECKIT END -->
