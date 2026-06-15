**English** · [Deutsch](README.de.md)

# Klaro

<p align="center">
  <img src="klaro.png" alt="Klaro" width="120" />
</p>

A personal web app for tracking contracts — subscriptions, insurance, housing, utilities, and more. Get an instant overview of your monthly spending and stay ahead of upcoming renewals.

## Features

- **Dashboard** — total active monthly spending, category breakdown, upcoming renewals (within 30 days), and expired contracts
- **Contract list** — sortable table with provider logos and category icons
- **Create / edit / delete** contracts with fields for name, category, amount, billing interval, status, start/end dates, service URL, cancellation notice period, notes, and a per-contract anonymization flag; the form uses a compact multi-column layout (name+category, amount+interval, and status+start+end each share a row) that collapses to a single column on mobile
- **Export** — download all contracts as JSON or Excel (.xlsx)
- **Import** — upload JSON or Excel with intelligent column auto-mapping
- **Anonymization** — hide real contract names globally or per contract using deterministic fantasy names
- **Localization** — English and German with locale-aware currency and date formatting
- **Multi-user accounts** — every family member signs in with their own account; contracts, dashboards, exports, and imports are scoped per account; administrators can create, archive, reactivate, delete, and manage roles for other accounts
- **Email invitations** — administrators invite new users by email; the invitation panel tracks pending, accepted, and expired invitations and allows resending or withdrawing them
- **Account settings** — the "My Account" page is divided into two sections: **Email Settings** (summary email preferences and email language) and **Account** (display name, email address change, password, and account deletion)
- **Email notifications** — transactional emails for key events: email-change verification, email-change confirmation, and password-change notification; administrators can send a test email from the admin panel to verify the SMTP connection
- **Delete account** — users can permanently delete their own account and all associated contracts via a "Danger Zone" section on the account settings page; a modal prompts for an optional JSON export before confirming; sole administrators are blocked from deleting until a second admin exists
- **Forgot password** — users can request a password reset link via email; the link expires after 1 hour and is single-use; the flow prevents email enumeration by returning a generic success message regardless of email validity
- **Summary email** — users can opt into a weekly (every Monday) or monthly (1st of each month) contract summary email delivered at 10:00 UTC; the email lists total monthly spending, a per-contract breakdown, upcoming renewals, a dashboard link, and a context-aware call to action; preferences are managed in Account Settings, which also displays the next scheduled send datetime; anonymized contract names are hidden in the email
- **Email language preference** — users can choose the language for all outgoing emails (verification, password reset, summary, etc.) independently of their browser/UI language; the preference is set in Account Settings under "Email Language"; supported languages are English and German; dates and currency values in emails are formatted according to the selected locale
- **Toast notifications** — success and error feedback on authenticated pages (account settings, admin panel, contract management) appears as auto-dismissing toast notifications in the top-right corner; public pages retain inline feedback

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

- Node.js 22+
- pnpm 9+

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

The app can be packaged as a single Docker image and self-hosted, e.g. on a homeserver.

**Prerequisites**: [Docker](https://docs.docker.com/get-docker/) and Docker Compose (bundled with Docker Desktop / `docker compose`).

```bash
# Build the image
docker build -t pcm .

# Start the app (also creates ./data on first run)
docker compose up -d
```

The app is then available at **http://localhost:3001**. The SQLite database is stored at `./data/contracts.db` on the host, so it survives container restarts and recreation.

On first start with a fresh database, the bootstrap administrator account's email and one-time password are printed to the container's logs — run `docker compose logs` to find them, sign in, and change the password immediately.

**Changing the host port**: edit the `ports:` line in `docker-compose.yml` — only the left-hand side (host port) needs to change, e.g. `"9090:3000"` exposes the app on port 9090.

**Changing the database location**: edit the `volumes:` line in `docker-compose.yml` to point at any host directory, e.g. `/mnt/storage/pcm-data:/data`.

## Database scripts

```bash
pnpm --filter backend db:migrate   # Apply schema
pnpm --filter backend db:seed      # Load sample contracts
pnpm --filter backend db:reset     # Drop and recreate schema
```

## Development workflow

Features are developed using [Spec Kit](https://github.com/specstory/spec-kit) following a spec → plan → tasks → implement flow. Each feature lives on its own branch and is merged to `main` via pull request after CI passes.
