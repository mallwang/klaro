# Feature Specification: Automated Release Workflow with Git Versioning and Docker Publishing

**Feature Branch**: `030-release-versioning`

**Created**: 2026-06-16

**Status**: Draft

**Input**: Set up automated release workflow: integrate release-it with @release-it/conventional-changelog for changelog generation and semantic versioning via git tags, and add a GitHub Actions release workflow that builds and pushes the Docker image to walefish/klaro on Docker Hub (tags: walefish/klaro:latest and walefish/klaro:vX.Y.Z) whenever a vX.Y.Z git tag is pushed. The release is triggered manually by running `pnpm run release` (which bumps version in root package.json, generates/updates CHANGELOG.md, commits, and creates the git tag) followed by `git push --follow-tags`. Update docker-compose.yml to reference walefish/klaro:latest instead of building locally. Also add a Claude skill for the full release flow with human review step and GitHub release note generation.

## Release Flow Overview

The full release lifecycle has two phases:

1. **Local release preparation** (developer-triggered via Claude skill `/release`):
   - Dry-run preview of version bump and changelog
   - Human approval step
   - Runs `pnpm run release` → creates release commit on `main` + git tag
   - Generates GitHub Release title and notes for manual copy-paste
   - Developer runs `git push --follow-tags`

2. **Automated publishing** (CI-triggered by the pushed tag):
   - GitHub Actions detects the `vX.Y.Z` tag
   - Builds Docker image and pushes `walefish/klaro:vX.Y.Z` + `walefish/klaro:latest` to Docker Hub

The release commit (`chore(release): vX.Y.Z`) is committed directly to `main` — no PR is needed. This is standard practice for machine-generated release commits in single-maintainer projects.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guided Release via Claude Skill (Priority: P1)

The developer wants to cut a new release. He runs `/release` in Claude Code. The skill first shows a dry-run preview: the proposed version bump (e.g., v1.0.0 → v1.1.0), the CHANGELOG entries that will be added, and a formatted GitHub Release title and body ready for copy-pasting. After the developer confirms, the skill runs `pnpm run release`, verifies the result (bumped version in `package.json`, updated `CHANGELOG.md`), and presents the final GitHub Release notes with instructions to push and paste.

**Why this priority**: The skill is the primary interface for releasing — without it, the developer must run and verify the steps manually.

**Independent Test**: Can be tested by running the skill in dry-run mode and confirming the preview output matches the actual conventional commits since the last tag.

**Acceptance Scenarios**:

1. **Given** there are conventional commits since the last tag, **When** `/release` is invoked, **Then** the skill shows a dry-run preview of version bump and changelog before any changes are made.
2. **Given** the dry-run preview is shown, **When** the developer declines, **Then** no files are modified, no commits are created, and no tags are created.
3. **Given** the developer confirms, **When** `pnpm run release` completes, **Then** the skill verifies that `package.json` version matches the expected bump and `CHANGELOG.md` contains the new entries.
4. **Given** verification passes, **When** the skill presents output, **Then** it provides a formatted GitHub Release title (e.g., `v1.1.0`) and a markdown release notes body derived from the changelog, plus the exact `git push --follow-tags` command to run.
5. **Given** no conventional commits exist since the last tag, **When** `/release` is invoked, **Then** the skill aborts with a clear message: "Nothing to release — no commits since last tag."

---

### User Story 2 - Automatic Docker Publishing via CI (Priority: P1)

After the developer pushes the git tag, GitHub Actions automatically builds and publishes the Docker image to Docker Hub.

**Why this priority**: Without automated publishing, a separate manual Docker build-and-push step defeats the automation purpose.

**Independent Test**: Can be tested by pushing a test tag matching `v*.*.*` to GitHub and verifying that both image tags appear on Docker Hub within 10 minutes.

**Acceptance Scenarios**:

1. **Given** a `vX.Y.Z` git tag is pushed to GitHub, **When** the CI release workflow runs, **Then** a Docker image is built from the root `Dockerfile` and pushed to Docker Hub with tags `walefish/klaro:vX.Y.Z` and `walefish/klaro:latest`.
2. **Given** Docker Hub credentials are stored as GitHub secrets, **When** the workflow authenticates, **Then** the push succeeds without credentials appearing in logs.
3. **Given** a branch push or non-version tag is pushed, **When** GitHub evaluates the trigger, **Then** the release workflow does NOT run.
4. **Given** a version tag is pushed, **When** the release workflow runs, **Then** the existing test CI workflow does NOT re-run for the same commit.

---

### User Story 3 - Self-Hosting via Docker Hub (Priority: P2)

A user wanting to self-host Klaro downloads `docker-compose.yml` and runs `docker-compose up`. Docker pulls the published image from Docker Hub — no source checkout or local build required. Updating to a new release is a `docker-compose pull` + restart.

**Why this priority**: The compose file is the primary self-hosting artifact. Pull-based setup reduces onboarding friction.

**Acceptance Scenarios**:

1. **Given** a user has only `docker-compose.yml` (no source), **When** they run `docker-compose up`, **Then** Docker pulls `walefish/klaro:latest` and starts the container.
2. **Given** a new release has been published, **When** the user runs `docker-compose pull` + `docker-compose up -d`, **Then** the container updates to the new image without rebuilding.

---

### Edge Cases

- What if `DOCKERHUB_USERNAME` or `DOCKERHUB_TOKEN` secrets are missing? The CI workflow fails with a clear authentication error at the login step.
- What if the same version tag is pushed twice? Docker Hub overwrites the existing tag; this is expected and acceptable.
- What if `/release` is run while not on `main`? The skill aborts with a warning before running `pnpm run release`.
- What if `pnpm run release` fails mid-way (e.g., git hook rejection)? The skill reports the failure and instructs the developer to resolve it manually before retrying.

## Requirements *(mandatory)*

### Functional Requirements

**Release tooling:**

- **FR-001**: `release-it` and `@release-it/conventional-changelog` MUST be installed as workspace-root dev dependencies.
- **FR-002**: A `"release"` script MUST be added to workspace root `package.json`, invoking `release-it`.
- **FR-003**: A `"version"` field (`"1.0.0"`) MUST be added to workspace root `package.json` so release-it can track and bump it.
- **FR-004**: Release-it MUST automatically determine the semantic version bump (patch/minor/major) from conventional commit types since the last git tag.
- **FR-005**: `CHANGELOG.md` MUST be created at the workspace root and updated on every release with entries generated from conventional commit history, grouped by type.
- **FR-006**: Release-it MUST create a release commit (`chore(release): vX.Y.Z`) and a git tag (`vX.Y.Z`) as part of the release command.
- **FR-007**: npm publishing MUST be disabled.
- **FR-008**: Automatic GitHub release creation by release-it MUST be disabled — GitHub release notes are generated by the Claude skill for manual entry.
- **FR-009**: Release-it MUST be configured to require the `main` branch and abort if run elsewhere.

**CI/CD:**

- **FR-010**: A GitHub Actions workflow (`release.yml`) MUST be added that triggers exclusively on tags matching `v*.*.*`.
- **FR-011**: The release workflow MUST build the Docker image and push to `walefish/klaro` with tags `vX.Y.Z` and `latest`.
- **FR-012**: The release workflow MUST authenticate with Docker Hub using `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` GitHub secrets.
- **FR-013**: The existing `ci.yml` workflow MUST be scoped to exclude version tag pushes to prevent redundant test runs.

**Docker Compose:**

- **FR-014**: `docker-compose.yml` MUST reference `walefish/klaro:latest` as the image source and MUST NOT include a local `build:` directive.

**Claude Skill `/release`:**

- **FR-015**: A Claude skill file MUST be created at `.claude/skills/release.md` implementing the guided release workflow.
- **FR-016**: The skill MUST first verify the current branch is `main` and the working tree is clean before proceeding.
- **FR-017**: The skill MUST run a dry-run preview (`release-it --dry-run`) and present the proposed version, version bump reason, and CHANGELOG entries to the developer for approval.
- **FR-018**: The skill MUST run `pnpm run release` only after explicit developer confirmation.
- **FR-019**: After the release command completes, the skill MUST verify the result by reading `package.json` (version matches) and `CHANGELOG.md` (new entries present).
- **FR-020**: The skill MUST generate a formatted GitHub Release title (e.g., `v1.1.0`) and markdown release notes body from the new CHANGELOG entries, ready for copy-paste into the GitHub UI.
- **FR-021**: The skill MUST present the `git push --follow-tags` command to the developer as the final step.

### Key Entities

- **Release**: A versioned snapshot identified by a git tag (`vX.Y.Z`), a `CHANGELOG.md` entry, and a published Docker image.
- **Git tag**: The trigger that links a release commit to a Docker Hub publish event.
- **Docker image**: Published to `walefish/klaro` on Docker Hub; each release produces a pinned tag and updates `latest`.
- **Claude skill `/release`**: The developer-facing orchestration tool for the local phase of the release workflow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer completes the full release cycle (dry-run review → confirm → release commit → push → Docker image on Hub) by running the `/release` skill, reviewing the output, running `git push --follow-tags`, and pasting release notes into GitHub UI — no other manual steps.
- **SC-002**: Both `walefish/klaro:vX.Y.Z` and `walefish/klaro:latest` appear on Docker Hub within 10 minutes of the tag push.
- **SC-003**: `CHANGELOG.md` accurately reflects all conventional commits since the last tag with zero manual editing.
- **SC-004**: A user can self-host Klaro using only `docker-compose.yml` without cloning the repository or building locally.

## Assumptions

- The developer always releases from the `main` branch; release-it enforces this.
- `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` GitHub secrets are configured before the first release.
- All commits use Conventional Commits format — already enforced by the existing commit-lint setup.
- The existing `Dockerfile` is production-ready and requires no changes for this feature.
- Initial version is set to `1.0.0`.
- GitHub Releases are created manually via the GitHub UI using the skill-generated notes — no GitHub token or automated release creation is needed.
- A separate local `docker-compose.yml` with `build: .` for development is out of scope; developers build locally via `docker build` directly.
