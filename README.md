**English** · [Deutsch](README.de.md)

# Klaro

<p align="center">
  <img src="klaro.png" alt="Klaro" width="120" />
</p>

A personal web app for tracking contracts — subscriptions, insurance, housing, utilities, and more. Get an instant overview of your monthly spending and stay ahead of upcoming renewals.

## Features

- **Dashboard** — total active monthly spending, category breakdown, upcoming renewals (within 30 days), and expired active contracts; deactivated contracts are kept out of the way in a collapsed, muted "Inactive Contracts" section that only appears when you have any and shows a count until expanded
- **Contract list** — compact, sortable table with provider logos and category icons; long names truncate with an ellipsis; action buttons match the Manage Accounts style
- **Create / edit / delete** contracts with fields for name, category, amount (displayed with a static EUR currency badge), billing interval, status, start/end dates (date picker with optional deselection), service URL, cancellation notice period, notes, and a per-contract anonymization flag; the form uses a compact multi-column layout (name+category, amount+interval, and status+start+end each share a row) that collapses to a single column on mobile
- **Export** — download all contracts as JSON or Excel (.xlsx)
- **Import** — upload JSON or Excel with intelligent column auto-mapping
- **Anonymization** — hide real contract names globally or per contract using deterministic fantasy names
- **Localization** — English and German with locale-aware currency and date formatting
- **Multi-user accounts** — every family member signs in with their own account; contracts, dashboards, exports, and imports are scoped per account; administrators can create, archive, reactivate, delete, and manage roles for other accounts
- **Email invitations** — administrators invite new users by email via an inline invite field in the Pending Invitations section; the invitations table directly below tracks pending, accepted, and expired invitations and allows resending or withdrawing them
- **Public self-service sign-up** — visitors can request an account from a "Sign up" link on the sign-in page without an invitation; after submitting an email and password they verify their address via an emailed link, which moves the request into an admin review queue (every administrator is notified by email); administrators see the pending request in a "Sign-up requests" table on the accounts page and can approve it (creating an active account and sending the usual welcome email) or reject it with an optional reason (the address stays blocked from resubmission until the rejected entry is deleted)
- **Account settings** — the "My Account" page is divided into two sections: **Email Settings** (summary email preferences and email language) and **Account** (display name, email address change, password, and account deletion)
- **Email notifications** — transactional emails for key events: email-change verification, email-change confirmation, and password-change notification; administrators can send a test email from the admin panel to verify the SMTP connection
- **Delete account** — users can permanently delete their own account and all associated contracts via a "Danger Zone" section on the account settings page; a modal prompts for an optional JSON export before confirming; sole administrators are blocked from deleting until a second admin exists
- **Forgot password** — users can request a password reset link via email; the link expires after 1 hour and is single-use; the flow prevents email enumeration by returning a generic success message regardless of email validity; the sign-in and forgot-password forms share a two-column authentication page with a decorative image panel and toggle between each other without a full page reload
- **Summary email** — users can opt into a weekly (every Monday) or monthly (1st of each month) contract summary email delivered at 10:00 UTC; the email lists total monthly spending, a per-contract breakdown, upcoming renewals, a dashboard link, and a context-aware call to action; preferences are managed in Account Settings, which also displays the next scheduled send datetime; anonymized contract names are hidden in the email
- **Email language preference** — users can choose the language for all outgoing emails (verification, password reset, summary, etc.) independently of their browser/UI language; the preference is set in Account Settings under "Email Language"; supported languages are English and German; dates and currency values in emails are formatted according to the selected locale
- **Toast notifications** — success and error feedback on authenticated pages (account settings, admin panel, contract management) appears as auto-dismissing toast notifications in the top-right corner; public pages retain inline feedback
- **FAQ** — a dedicated FAQ page accessible from the sidebar navigation, displaying questions and answers in an accordion layout alongside a decorative illustration; content is managed via the i18n translation files (no code changes needed to update questions or answers); fully localised in English and German
- **Admin diagnostics** — an admin-only page at `/admin/diagnostics` (also reachable via **Diagnostics** in the sidebar's Admin segment) reporting application/database/runtime versions, live system checks (reverse-proxy detection, domain/HTTPS match, container status, outbound internet access, DNS resolution, clock drift, WebSocket-support flag), and environment variable configuration (SMTP host/port/from-address/from-name shown as configured, logo.dev shown as configured/not configured only), grouped into "Versions", "System Checks", and "Environment Variables" sections; SMTP credentials (`SMTP_USER`/`SMTP_PASSWORD`) are never shown, only the non-secret connection settings; each live check runs with its own timeout so one slow or failed check never blocks the rest of the page; a plain-HTML fallback at the same path works with JavaScript disabled

For a full walkthrough of the UI, see [docs/user-guide.md](docs/user-guide.md).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify + TypeScript + SQLite (better-sqlite3) |
| Frontend | React + TypeScript + Vite + TanStack Query |
| UI | Mantine 7 |
| Testing | Vitest (unit + integration), Playwright (e2e) |
| Monorepo | pnpm workspaces |

## Prerequisites

- Node.js 24+
- pnpm 10+

## Getting started

```bash
# Install dependencies
pnpm install

# Set up the database and load sample data
pnpm --filter backend db:migrate
pnpm --filter backend db:seed

# Start both servers
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend API runs at [http://localhost:3000](http://localhost:3000).

### Signing in

The app requires every visitor to sign in. On a fresh database, `db:migrate` automatically creates a bootstrap **administrator** account and prints its email and a one-time password to the backend's console output — sign in with those credentials and change the password right away from "My Account". `db:seed` additionally creates two ready-to-use development accounts: `admin@example.test` / `dev-admin-pass` (administrator) and `member@example.test` / `dev-member-pass` (member). See [Accounts & sign-in](docs/user-guide.md#10-accounts--sign-in) in the user guide for details.

## Running tests

```bash
# All unit and integration tests
pnpm test

# End-to-end tests (requires running app)
pnpm --filter frontend test:e2e
```

## Project structure

```
packages/
├── shared/       # Shared TypeScript types and Zod schemas
├── backend/      # Fastify API server
│   ├── src/db/           # SQLite schema, client, migrations, seed
│   ├── src/routes/       # Route handlers
│   └── src/services/     # Business logic
└── frontend/     # React + Vite SPA
    ├── src/components/   # UI components
    ├── src/pages/        # Page components
    └── src/services/     # API hooks (TanStack Query)
```

## Deployment

The app is published to Docker Hub as [`walefish/klaro`](https://hub.docker.com/r/walefish/klaro). You can self-host it on any machine with Docker — no source checkout required.

**Prerequisites**: [Docker](https://docs.docker.com/get-docker/) and Docker Compose (bundled with Docker Desktop / `docker compose`).

```bash
# Pull the latest image and start the app
docker compose pull
docker compose up -d
```

The app is then available at **http://localhost:3001**. The SQLite database is stored at `./data/contracts.db` on the host, so it survives container restarts and recreation.

On first start with a fresh database, the bootstrap administrator account's email and one-time password are printed to the container's logs — run `docker compose logs` to find them, sign in, and change the password immediately.

**Changing the host port**: edit the `ports:` line in `docker-compose.yml` — only the left-hand side (host port) needs to change, e.g. `"9090:3000"` exposes the app on port 9090.

**Changing the database location**: edit the `volumes:` line in `docker-compose.yml` to point at any host directory, e.g. `/mnt/storage/pcm-data:/data`.

**Enabling provider logos**: the app proxies logo images through its own backend so your token stays server-side. Uncomment and set `LOGO_DEV_TOKEN` in `docker-compose.yml` with a token from [logo.dev](https://logo.dev):

```yaml
environment:
  LOGO_DEV_TOKEN: pk_your_token_here
```

Without this token the app works normally — a generic icon is shown in place of provider logos.

**Updating to a newer version**: run `docker compose pull && docker compose up -d` — Docker pulls the new `latest` image and restarts the container. Your data is untouched.

## Releases

Releases follow [Conventional Commits](https://www.conventionalcommits.org/) and [Semantic Versioning](https://semver.org/). Each release produces:

- A version bump in `package.json`
- A new entry in `CHANGELOG.md`
- A git tag `vX.Y.Z`
- A Docker image pushed to `walefish/klaro` with both `latest` and `vX.Y.Z` tags

**For maintainers** — to cut a release, run the `/release` Claude skill in Claude Code:

```
/release
```

The skill guides you through a dry-run preview, asks for confirmation, runs `pnpm run release`, verifies the result, and generates formatted GitHub Release notes. After approval, run `git push --follow-tags` to publish the tag and trigger the Docker CI workflow automatically.

## Database scripts

```bash
pnpm --filter backend db:migrate   # Apply schema
pnpm --filter backend db:seed      # Load sample contracts
pnpm --filter backend db:reset     # Drop and recreate schema
```

## Development workflow

Features are developed using [Spec Kit](https://github.com/specstory/spec-kit) following a spec → plan → tasks → implement flow. Each feature lives on its own branch and is merged to `main` via pull request after CI passes.
