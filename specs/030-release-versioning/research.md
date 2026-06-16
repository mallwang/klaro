# Research: Automated Release Workflow

## Decision 1: Release tooling — release-it + @release-it/conventional-changelog

**Decision**: Use `release-it` (v17+) with the `@release-it/conventional-changelog` plugin.

**Rationale**: Single command (`pnpm run release`) covers version bump, CHANGELOG generation,
release commit, and git tag. The conventional-changelog plugin understands the `angular` preset
(feat/fix/chore/BREAKING CHANGE) already enforced in this project. Actively maintained, no lock-in.

**Alternatives considered**:
- `standard-version`: Deprecated since 2022.
- `semantic-release`: Fully automated (no human review step), requires CI write token,
  too heavyweight for a single-maintainer project.
- `changelogen` (unjs): Lighter, less mature plugin ecosystem.

**Configuration highlights**:
- `npm.publish: false` — private monorepo, not an npm package
- `github.release: false` — GitHub releases are created manually via skill-generated notes
- `git.requireBranch: "main"` — enforces releases only from main
- `git.commitMessage: "chore(release): v${version}"` — conventional commit format
- `git.tagName: "v${version}"` — produces `v1.0.0`-shaped tags

---

## Decision 2: GitHub Actions Docker publishing — docker/build-push-action@v6

**Decision**: `docker/setup-buildx-action@v3` + `docker/login-action@v3` + `docker/build-push-action@v6`.

**Rationale**: Official Docker-maintained actions, support multi-tag pushes in a single build
(no double build), and require BuildKit which the existing multi-stage Dockerfile already needs.

**Tag strategy**: Push both `walefish/klaro:latest` and `walefish/klaro:${{ github.ref_name }}`
in one build-push step.

**Trigger**: `on: push: tags: ['v*.*.*']` — fires only for semver-shaped tags.

---

## Decision 3: CI workflow event model — two independent events from one push

When `git push --follow-tags` runs after `pnpm run release`, GitHub fires **two separate events**:

| Event | What triggers it | Which workflow runs |
|-------|-----------------|---------------------|
| Branch push (`main` updated) | `chore(release)` commit lands on `main` | `ci.yml` — tests run ✅ |
| Tag push (`v1.0.0` created) | The `v*.*.*` tag is pushed | `release.yml` — Docker build+push ✅ |

The existing `ci.yml` uses `on: push: branches: [main]`. The `branches` filter only matches
branch head pushes, not tag pushes — so `ci.yml` runs exactly once (for the release commit),
never a second time for the tag. **FR-013 is already satisfied with zero changes to `ci.yml`.**

Running tests on the release commit is intentional: it gives confidence the
`chore(release)` commit itself did not accidentally break anything.

---

## Decision 4: Initial version — 1.0.0

**Decision**: Set `"version": "1.0.0"` in root `package.json`.

**Rationale**: The app is feature-complete (multi-user, Docker-packaged, full contract management).
`1.0.0` signals stability. `0.x` would conventionally imply "unstable API", which does not
reflect current state.

---

## Decision 5: CHANGELOG.md bootstrapping

**Decision**: `CHANGELOG.md` is created automatically by `@release-it/conventional-changelog`
on the first `pnpm run release` — no manual seeding required.

**Note**: The first release will produce a long CHANGELOG from all historical conventional
commits. This is expected and acceptable — it's a one-time artifact.

---

## Decision 6: Claude skill placement

**Decision**: Skill at `.claude/skills/release.md`, invoked as `/release`.

**Rationale**: All project-specific Claude skills live in `.claude/skills/`. The skill
orchestrates: branch check → dry-run preview → human confirm → run release → verify result
→ present GitHub Release notes + push command.
