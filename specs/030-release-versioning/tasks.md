# Tasks: Automated Release Workflow with Git Versioning and Docker Publishing

**Input**: Design documents from `specs/030-release-versioning/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: No unit test tasks — this feature adds CI config, JSON config, and a Markdown skill
file. None are subject to the TDD mandate (see plan.md Constitution Check). Validation is
performed via the runnable scenarios in quickstart.md (Phase 7).

**Organization**: Grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no inter-task dependency)
- **[Story]**: Maps to user story in spec.md (US1/US2/US3)

---

## Phase 1: Setup (Install Dependencies)

**Purpose**: Add the new npm packages to the workspace root. Must complete before any config
or implementation tasks.

- [x] T001 Install `release-it` and `@release-it/conventional-changelog` as workspace-root devDependencies: run `pnpm add -D -w release-it @release-it/conventional-changelog` and verify both appear in `package.json` devDependencies

**Checkpoint**: `node_modules/release-it` and `node_modules/@release-it/conventional-changelog` exist at workspace root.

---

## Phase 2: Foundational (release-it Configuration)

**Purpose**: Wire up the `package.json` version/script and the `.release-it.json` config file.
These are blocking prerequisites for US1 (the `/release` skill) and indirectly required for
US2 (the tag format used by CI comes from this config).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Add `"version": "1.0.0"` field and `"release": "release-it"` script to `package.json` (workspace root)
- [x] T003 Create `.release-it.json` at workspace root with:
  - `plugins["@release-it/conventional-changelog"]`: preset `angular`, infile `CHANGELOG.md`
  - `git.commitMessage`: `"chore(release): v${version}"`
  - `git.tagName`: `"v${version}"`
  - `git.requireBranch`: `"main"`
  - `npm.publish`: `false`
  - `github.release`: `false`

**Checkpoint**: Running `pnpm run release -- --dry-run` on `main` with at least one conventional
commit since the last tag (or from history) prints a proposed version bump and changelog preview
without modifying any files.

---

## Phase 3: User Story 1 — Guided Release via Claude Skill (Priority: P1) 🎯 MVP

**Goal**: Developer can run `/release` in Claude Code and be guided through dry-run preview,
confirmation, release execution, result verification, and GitHub Release note generation.

**Independent Test**: Invoke `/release` and confirm it shows a dry-run preview before making
any changes, runs `pnpm run release` after confirmation, verifies version + CHANGELOG, and
presents formatted GitHub Release title + notes + push command. Abort path: invoke with no
prior commits since last tag and confirm the skill exits cleanly with "Nothing to release".

### Implementation for User Story 1

- [x] T004 [US1] Create `.claude/skills/release.md` implementing the guided `/release` skill with these steps in order:
  1. **Branch check**: verify `git branch --show-current` returns `main`; if not, abort with message "Must be on main branch to release"
  2. **Clean tree check**: verify `git status --porcelain` returns empty; if not, abort with message "Working tree has uncommitted changes — commit or stash before releasing"
  3. **Dry-run preview**: run `pnpm run release -- --dry-run` and display the full output (proposed version, changelog entries) to the developer
  4. **Confirmation gate**: ask developer "Proceed with release? (yes/no)" and abort cleanly if declined
  5. **Run release**: execute `pnpm run release`
  6. **Verify result**:
     - Read `package.json` and confirm `version` matches the proposed bump from the dry-run
     - Read `CHANGELOG.md` and confirm a new section header for the new version exists
     - If either check fails, report the discrepancy and stop
  7. **Generate GitHub Release output**:
     - Extract the new version's section from `CHANGELOG.md` (from the new version header down to the previous version header)
     - Format a **GitHub Release title**: `v<version>` (e.g., `v1.1.0`)
     - Format a **GitHub Release body** in markdown using the extracted changelog section
     - Present title and body in clearly labelled copy-paste blocks
  8. **Final step**: present the command `git push --follow-tags` and instruct developer to run it, then create the GitHub Release via the GitHub UI using the output above

**Checkpoint**: Running `/release` produces a dry-run preview, accepts a yes/no confirmation,
executes the release on approval, and outputs formatted GitHub Release notes — all without the
developer needing to run any commands manually except `git push --follow-tags`.

---

## Phase 4: User Story 2 — Automatic Docker Publishing via CI (Priority: P1)

**Goal**: Pushing a `vX.Y.Z` git tag triggers GitHub Actions to build and push
`walefish/klaro:vX.Y.Z` and `walefish/klaro:latest` to Docker Hub.

**Independent Test**: Push a test tag (`v0.0.1-test`) to GitHub and verify the `Release`
workflow appears under the Actions tab, completes successfully, and both image tags appear
on `hub.docker.com/r/walefish/klaro/tags`. Clean up the test tag afterwards.

### Implementation for User Story 2

- [x] T005 [US2] Create `.github/workflows/release.yml` with:
  - `on: push: tags: ['v*.*.*']`
  - Single job `docker` on `ubuntu-latest`
  - Steps: `actions/checkout@v4`, `docker/setup-buildx-action@v3`, `docker/login-action@v3` (secrets `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`), `docker/build-push-action@v6` with `push: true` and tags `walefish/klaro:latest,walefish/klaro:${{ github.ref_name }}`
  - No caching, no matrix — keep it minimal

**Checkpoint**: Workflow file is valid YAML, the trigger matches only `v*.*.*` tags (not
branch pushes, not other tags), and credentials are referenced via secrets (no hardcoded values).

---

## Phase 5: User Story 3 — Self-Hosting via Docker Hub (Priority: P2)

**Goal**: `docker-compose.yml` references `walefish/klaro:latest` so end-users pull from
Docker Hub without cloning the source or building locally.

**Independent Test**: Run `docker-compose pull && docker-compose up -d` in an empty directory
(containing only `docker-compose.yml`) and confirm the container starts from the remote image
with no build step logged.

### Implementation for User Story 3

- [x] T006 [US3] Update `docker-compose.yml`:
  - Replace `image: pcm` with `image: walefish/klaro:latest`
  - Remove the `build: .` line entirely
  - Leave all other fields (ports, environment, volumes, restart) unchanged

**Checkpoint**: `docker-compose config` shows `image: walefish/klaro:latest` with no `build`
key. `docker-compose pull` succeeds without a source checkout.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates required by CLAUDE.md after every feature implementation.

- [x] T007 [P] Update `README.md`: add a "Releases" or "Docker" section documenting the `walefish/klaro` image, how to pull with `docker-compose`, and the `pnpm run release` + `/release` skill workflow for maintainers
- [x] T008 [P] Update `README.de.md`: same content as T007 in German, keeping both files consistent
- [x] T009 [P] Update `docs/user-guide.md`: document how to update a self-hosted Klaro instance (`docker-compose pull` + restart) and what the versioned tags mean
- [x] T010 [P] Update `docs/user-guide.de.md`: same content as T009 in German
- [x] T011 Validate all quickstart.md scenarios: dry-run preview (Scenario 1), full local release (Scenario 2), self-host compose (Scenario 4), `/release` skill (Scenario 5), branch guard (Scenario 6)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 (deps installed)
- **Phase 3 (US1 — /release skill)**: Depends on Phase 2 (release-it must be configured)
- **Phase 4 (US2 — CI workflow)**: Depends on Phase 2 (tag format comes from `.release-it.json`)
- **Phase 5 (US3 — docker-compose)**: Independent of Phases 3–4; depends only on Phase 1
- **Phase 6 (Polish)**: Depends on Phases 3–5 being complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 complete (release-it config)
- **US2 (P1)**: Requires Phase 2 complete (tag format); independent of US1
- **US3 (P2)**: Requires only Phase 1 complete; can be done any time after T001

### Within Each Phase

- Phase 2: T002 and T003 can be done in either order (different files)
- Phase 3: T004 is a single task (one new file)
- Phase 6: T007–T010 are all [P] — different files, no ordering requirement

---

## Parallel Opportunities

```bash
# After T001 completes, Phase 2 tasks are independent of each other:
T002  # package.json version + script
T003  # .release-it.json

# After Phase 2 completes, US1 and US2 can proceed in parallel:
T004  # .claude/skills/release.md  (US1)
T005  # .github/workflows/release.yml  (US2)

# US3 (T006) can start after T001 — independent of US1/US2:
T006  # docker-compose.yml

# All polish tasks are parallel after T007–T010:
T007  T008  T009  T010  # different doc files
```

---

## Implementation Strategy

### MVP (US1 + US2 — the release pipeline)

1. Phase 1: Install deps (T001)
2. Phase 2: Configure release-it (T002, T003)
3. Phase 3: Create `/release` skill (T004) — US1 ✅
4. Phase 4: Create `release.yml` CI workflow (T005) — US2 ✅
5. **Validate**: dry-run on main, push a test tag, confirm Docker Hub publish
6. **Stop and ship**: the release pipeline is fully functional

### Full Delivery (add US3 + docs)

6. Phase 5: Update docker-compose.yml (T006) — US3 ✅
7. Phase 6: Documentation (T007–T011)

---

## Notes

- No TypeScript source files are created — Constitution TDD exemption applies (see plan.md)
- The `ci.yml` workflow requires **no changes** (see research.md Decision 3)
- `CHANGELOG.md` is generated automatically on first `pnpm run release` — no manual seeding needed
- After T005, add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in GitHub repo settings before pushing any real release tag
- [P] tasks operate on different files with no shared state — safe to run concurrently
