# Release Artifact Contract

Every `pnpm run release` + `git push --follow-tags` cycle produces the following artifacts.

## Git artifacts

| Artifact | Format | Example |
|----------|--------|---------|
| Release commit | `chore(release): v<semver>` | `chore(release): v1.1.0` |
| Git tag | `v<semver>` | `v1.1.0` |

The tag always points to the release commit.

## CHANGELOG.md

Updated at the workspace root. New entries are prepended above the previous release block.
Format follows the `angular` conventional-changelog preset:

```markdown
## [1.1.0] - 2026-06-16

### Features
- contract export to CSV (#11)

### Bug Fixes
- date display off by one in renewal panel (#12)
```

## Docker Hub images

Repository: `walefish/klaro`

| Tag | Meaning |
|-----|---------|
| `walefish/klaro:v<semver>` | Pinned release; never mutated after push |
| `walefish/klaro:latest` | Always points to the most recent release |

Both tags are pushed atomically in a single CI job triggered by the git tag.

## Version in package.json

`version` field at workspace root is bumped to match the release tag (without the `v` prefix):

```json
{ "version": "1.1.0" }
```

## Semver bump rules

| Commit type since last tag | Bump |
|----------------------------|------|
| Only `fix:` commits | patch (1.0.0 → 1.0.1) |
| At least one `feat:` commit | minor (1.0.0 → 1.1.0) |
| Any commit with `BREAKING CHANGE:` footer | major (1.0.0 → 2.0.0) |
| No conventional commits | release aborted |
