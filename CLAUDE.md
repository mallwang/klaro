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

## GitHub CLI (`gh`)

Use the `gh` CLI for GitHub-specific interactions (PRs, CI runs, issues, releases).
Use plain `git` for all standard repository workflow operations (commit, pull, push,
branch, merge, rebase, log, diff, etc.). Never use raw `curl` against the GitHub API
when `gh` can do the same job.

**Typical read operations** (run freely, no confirmation needed):
- View PR status, checks, and reviews: `gh pr view`, `gh pr checks`
- List and inspect failed CI runs: `gh run list`, `gh run view`, `gh run view --log-failed`
- List issues and PRs: `gh issue list`, `gh pr list`
- View PR comments: `gh api repos/{owner}/{repo}/pulls/{number}/comments`

**Write / delete operations** (ALWAYS ask for explicit confirmation before running):
- Creating a PR: `gh pr create`
- Merging a PR: `gh pr merge`
- Closing or reopening issues or PRs: `gh issue close`, `gh pr close`
- Pushing or force-pushing: `gh` commands that trigger a push
- Deleting branches, releases, or tags: `gh branch delete`, `gh release delete`
- Posting comments or reviews: `gh pr comment`, `gh pr review`
- Any `gh api` call using `--method POST/PATCH/PUT/DELETE`

**Rule**: before running any write or delete command, state the exact command you intend
to run and wait for the user to type an explicit "yes" or "go ahead". Never infer consent
from earlier in the conversation.

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
at specs/030-release-versioning/plan.md
<!-- SPECKIT END -->
