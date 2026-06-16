# Quickstart: Validating the Release Workflow

## Prerequisites

- On branch `main` with a clean working tree
- At least one conventional commit exists since the last git tag (or since the beginning of
  history for the first release)
- GitHub secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` configured in repo settings
- Docker Hub repository `walefish/klaro` exists and is public

---

## Scenario 1: Dry-run preview (no changes)

Verify the tooling is configured correctly without creating any artifacts.

```bash
pnpm run release -- --dry-run
```

**Expected output**:
- Proposed version bump shown (e.g., `1.0.0 → 1.1.0`)
- List of commits that will be included in the changelog
- No files modified, no commits created, no tags created

---

## Scenario 2: Full local release

Run the release and verify all local artifacts.

```bash
pnpm run release
```

**Verify**:

1. `package.json` at workspace root — `"version"` matches the bumped value
2. `CHANGELOG.md` at workspace root — new section prepended with the release version and date
3. `git log --oneline -3` — shows a new `chore(release): vX.Y.Z` commit on top
4. `git tag --sort=-version:refname | head -3` — shows the new `vX.Y.Z` tag

---

## Scenario 3: CI Docker publish

Push the tag and verify Docker Hub publishing.

```bash
git push --follow-tags
```

**Verify in GitHub Actions** (`Actions` tab → `Release` workflow):
- Workflow triggered by the tag push
- All steps complete (login, buildx, build-push)
- No credential values appear in step logs

**Verify on Docker Hub** (`hub.docker.com/r/walefish/klaro/tags`):
- Tag `latest` updated (check `Last pushed` timestamp)
- Tag `vX.Y.Z` present and points to same digest as `latest`

---

## Scenario 4: Self-host via Docker Compose

Verify the updated `docker-compose.yml` pulls from Docker Hub without building locally.

```bash
# In a directory with only docker-compose.yml (no source checkout)
docker-compose pull
docker-compose up -d
curl http://localhost:3001/health   # or open in browser
```

**Expected**: Container starts from `walefish/klaro:latest`, no build step logged.

---

## Scenario 5: /release Claude skill

Invoke the skill in Claude Code and follow the guided flow.

```
/release
```

**Verify**:
1. Skill checks branch is `main` and working tree is clean before proceeding
2. Dry-run preview is shown and approval is requested
3. After confirmation, `pnpm run release` is run and result is verified
4. GitHub Release title (`vX.Y.Z`) and markdown release notes are presented
5. `git push --follow-tags` command is shown as the final step

---

## Scenario 6: Branch guard

Verify that releasing from a non-main branch is blocked.

```bash
git checkout -b test/not-main
pnpm run release
```

**Expected**: release-it aborts with a message that `main` branch is required.
