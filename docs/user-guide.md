**English** · [Deutsch](user-guide.de.md)

# User Guide

Personal Contract Management is a local web app that keeps all your contracts — streaming services, insurance policies, mobile plans, rent, utilities — in one place. It shows you what you spend each month, warns you before auto-renewals, and tells you when contracts have already expired.

## Table of contents

1. [Getting around](#1-getting-around)
2. [Dashboard](#2-dashboard)
3. [Contract list](#3-contract-list)
4. [Adding a contract](#4-adding-a-contract)
5. [Editing and deleting](#5-editing-and-deleting)
6. [Importing contracts](#6-importing-contracts)
7. [Exporting contracts](#7-exporting-contracts)
8. [Anonymization](#8-anonymization)
9. [Language](#9-language)
10. [Accounts & sign-in](#10-accounts--sign-in)
11. [Contract fields reference](#11-contract-fields-reference)

---

## 1. Getting around

The app has a persistent navigation sidebar on the left. It is divided into two segments:

**App** — available to every signed-in user:

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Spending overview, renewals, expired contracts |
| Contracts | `/contracts` | Full list; create, import, export |
| My Account | `/account` | Display name, email, password, delete account |

**Admin** — visible only to administrators:

| Page | URL | Purpose |
|------|-----|---------|
| Accounts | `/admin/accounts` | Invite users, manage accounts |

The **Sign out** button is at the bottom of the sidebar. Your display name and role (Administrator / Member) are shown just above it.

---

## 2. Dashboard

The dashboard opens when you visit the app. It gives you a snapshot of your current situation.

### Monthly spending

The large number at the top is the sum of all **active** contracts converted to a monthly figure:

| Billing interval | Conversion |
|-----------------|-----------|
| Weekly | × 52 ÷ 12 |
| Monthly | × 1 |
| Quarterly | ÷ 3 |
| Yearly | ÷ 12 |
| Lifetime | not included |

**Example:** You have Netflix at €12.99/month and a yearly gym membership at €240/year. The dashboard shows €12.99 + (€240 ÷ 12) = **€32.99/month**.

### Category breakdown

A table beneath the total groups your active contracts by category and shows how much each category costs per month, sorted from highest to lowest.

### Upcoming renewals

Any contract whose end date falls within the next 30 days appears here. Each row shows:

- Contract name
- End date
- **Cancellation deadline** — the last day to cancel without being locked in for another period (end date minus the notice period you set)
- Days remaining, colour-coded:
  - **Red** — deadline already passed
  - **Amber** — 7 days or fewer remaining
  - **Grey** — more than 7 days remaining

**Example:** Your mobile contract ends on 30 June with a 14-day cancellation notice. The cancellation deadline shown is 16 June. If today is 18 June the row turns red.

### Expired contracts

Contracts whose end date is in the past appear in an amber-highlighted panel. The panel shows how many days each contract is overdue. Click a row to go straight to the edit page.

---

## 3. Contract list

Open **Contracts** from the navigation to see all your contracts in a table.

### Sorting

Click any column header to sort by that column. Click again to reverse the order. A third click clears the sort. The active sort direction is shown with a small up or down arrow.

Available sort columns: Name, Category, Amount, Status, End Date.

### Toolbar

The row of controls above the table contains:

| Control | What it does |
|---------|-------------|
| Anonymization toggle | Hides real names (see [Anonymization](#8-anonymization)) |
| Export | Downloads all contracts as JSON or Excel |
| Import | Opens the import wizard |
| Add Contract | Opens the create form |

---

## 4. Adding a contract

Click **Add Contract** from the contract list. Fill in the form and click **Save**.

### Minimal example — streaming subscription

| Field | Value |
|-------|-------|
| Name | Netflix |
| Category | Subscriptions |
| Amount | 12.99 |
| Billing interval | Monthly |

That's all you need. The four fields above are required; everything else is optional.

### Fuller example — insurance policy

| Field | Value |
|-------|-------|
| Name | Home Contents Insurance |
| Category | Insurance |
| Amount | 180.00 |
| Billing interval | Yearly |
| Status | Active |
| Start date | 2024-03-01 |
| End date | 2025-03-01 |
| Cancellation notice | 4 Weeks |
| Service URL | https://myinsurer.example.com/account |
| Details | Policy number: INS-4821. Covers up to €50 000. |
| Anonymize | off |

With these values the dashboard will warn you on or before 1 February (28 days before the 1 March end date) that you need to act.

### Field notes

- **Status** defaults to Active. Set it to Inactive for contracts you have already cancelled but want to keep for reference.
- **Cancellation notice** requires both a number and a unit (Days / Weeks / Months / Years). If you leave it blank the dashboard treats the end date itself as the deadline.
- **Service URL** must be a valid URL if provided. It is not clickable in the table, but useful to copy from the edit form.
- **Details** accepts up to 2 000 characters. A counter appears when you approach the limit.
- **Anonymize** — tick this to always hide this specific contract's name regardless of the global toggle.

---

## 5. Editing and deleting

### Editing

Click the **Edit** link in a contract row to open the edit form. All fields are pre-filled. Make your changes and click **Save Changes**.

### Deleting

Click **Delete** in a contract row. The button changes to **Confirm** and **Cancel** inline — click **Confirm** to permanently remove the contract or **Cancel** to abort.

---

## 6. Importing contracts

Click **Import** from the contract list toolbar. The wizard has five steps.

### Step 1 — Upload

Drag and drop a file onto the upload area, or click to browse. Supported formats:

- **JSON** — an array of objects, e.g. exported from this app
- **Excel (.xlsx)** — one sheet with a header row

Maximum file size: 5 MB.

### Step 2 — Parse

The app reads the file and detects its columns automatically.

### Step 3 — Map columns

Each column from your file is matched to a field in the app. The app recognises common synonyms and maps them automatically:

| If your column is called… | It maps to |
|--------------------------|-----------|
| Service Name, Title, Label | Name |
| Monthly Cost, Fee, Price, Charge | Amount |
| Billing Frequency, Payment Cycle | Billing interval |
| Expiry, Expiration, Renewal Date | End date |
| Notes, Description, Comments | Details |
| Website, Link, Homepage | Service URL |

Required fields are marked with a `*`. If a required field is not mapped the row will be shown in red and must be resolved before import can continue. Optional columns can be explicitly skipped.

### Step 4 — Import

The app creates a contract for each row. Rows that fail validation (e.g. invalid category value) are skipped and reported individually.

### Step 5 — Results

A summary shows how many contracts were created and how many failed, with a per-row error message for failures. Partial imports are allowed — successfully parsed rows are saved even if others fail.

### Example JSON file

```json
[
  {
    "name": "Spotify",
    "category": "SUBSCRIPTIONS",
    "amount": 9.99,
    "billingInterval": "MONTHLY",
    "status": "ACTIVE",
    "endDate": "2025-12-31"
  },
  {
    "name": "Car Insurance",
    "category": "INSURANCE",
    "amount": 420.00,
    "billingInterval": "YEARLY",
    "startDate": "2025-01-01",
    "endDate": "2026-01-01",
    "cancellationPeriod": { "value": 1, "unit": "MONTHS" }
  }
]
```

Valid category values: `UTILITIES`, `SUBSCRIPTIONS`, `INSURANCE`, `HOUSING`, `OTHER`

Valid billing interval values: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `LIFETIME`

---

## 7. Exporting contracts

Click **Export** in the contract list toolbar and choose a format.

| Format | Filename | Use case |
|--------|----------|---------|
| JSON | `contracts-YYYY-MM-DD.json` | Backup, re-import, scripting |
| Excel | `contracts-YYYY-MM-DD.xlsx` | Spreadsheet editing, sharing |

The export contains all contracts including inactive ones. All fields are included. The JSON export can be fed directly back into the import wizard without any column mapping.

---

## 8. Anonymization

The anonymization feature replaces real contract names with fictional company names so you can share your screen or take screenshots without revealing what services you use.

### Global toggle

Click **Anonymization** in the contract list toolbar. The button switches between:

- **Hide Real** — anonymization is on; real names are hidden everywhere
- **Show Real** — anonymization is off; real names are displayed

The preference is saved in your browser and persists across page reloads.

### Per-contract flag

Tick the **Anonymize** checkbox when creating or editing a contract to always hide that specific contract, even when the global toggle is off. Useful for a contract you consider particularly sensitive.

### How the replacement works

Each contract is consistently mapped to the same fictional name (e.g. "Aether Dynamics", "Ironveil Corp", "Starfall Industries") based on its internal ID. The same contract always gets the same alias — the mapping never changes between sessions.

Amounts, dates, categories, and status values are always visible regardless of the anonymization setting.

---

## 9. Language

The app supports **English** and **German**. Use the `EN` / `DE` buttons in the top-right corner of any page to switch. The preference is saved in your browser.

Currency amounts and dates are formatted according to the selected locale (e.g. `€15,99` and `01.03.2025` in German).

---

## 10. Accounts & sign-in

Every visitor must sign in. Contracts, dashboards, exports, and imports are scoped to the signed-in account — nobody can see or change another account's contracts.

### Signing in and out

Open the app and you'll land on the sign-in page if you don't already have an active session. Enter your email and password to continue. Use the **Sign out** button at the bottom of the sidebar to end your session on this device.

If you enter the wrong password too many times in a row, the account is temporarily locked — wait a few minutes and try again with the correct password.

### The first account

The very first time the app starts on a fresh installation, it automatically creates an **administrator** account and prints its email address and a one-time password to the server log (visible with `docker compose logs` or in the terminal running the backend). Sign in with those credentials and **change the password immediately** from My Account.

If you're upgrading from an older version of the app, this same bootstrap administrator account is created and **all of your existing contracts are automatically assigned to it** — nothing is lost.

### My Account

Open **My Account** from the sidebar to manage your own profile. It has three sections:

**Display name** — change the name shown in the sidebar and on the accounts admin page. Enter a new name and click **Save**.

**Email address** — your current address is shown. To change it, enter the new address and click **Request change**. The app sends a verification link to the new address; click it to confirm. Until confirmed, your old address remains active and a notice is shown on this page. You can request a new link at any time by submitting again.

**Password** — enter your current password and a new one (at least 8 characters), then click **Change password**.

### Email notifications

The app sends transactional emails for security-relevant events:

| Event | Who receives it |
|-------|----------------|
| Email address change requested | Verification link sent to the **new** address |
| Email address change confirmed | Confirmation sent to the **new** address |
| Password changed | Notification sent to your **current** address |
| Invitation to join | Invitation link sent to the **invited** address |

### Deleting your account

Open **My Account** and scroll to the **Danger Zone** section at the bottom. Click **Delete account** to open the deletion modal. The modal walks you through two steps:

1. **Export (optional)** — if you have contracts, a button lets you download them as JSON before you proceed. Click **Skip** if you don't need a backup.
2. **Confirm** — click **Delete account** to permanently remove your account and all its contracts. This cannot be undone.

> **Sole-admin guard**: if you are the only active administrator, the confirm button is disabled. You must promote another member to administrator first, or ask another admin to do it.

### Inviting new members (administrators only)

To add someone to the household, go to **Accounts** in the admin sidebar section and enter their email address in the **Invite** form, then click **Send invitation**. The app emails them a link that lets them set their own password and sign in. The invitation expires after 7 days; you can resend it at any time from the invitations table.

The invitations table below the form shows all past invitations and their status:

| Status | Meaning |
|--------|---------|
| Pending | Sent, not yet accepted |
| Expired | Deadline passed before the person accepted |
| Accepted | The person has set their password and signed in |
| Cancelled | You withdrew the invitation |

For pending and expired invitations, two actions are available: **Resend** (sends a fresh link) and **Withdraw** (cancels the invitation).

### Managing accounts (administrators only)

The accounts table on the **Accounts** admin page lists every account with its display name, email address, role, and status. Available actions:

- **Archive** — removes the person's access. Archived accounts cannot sign in; their contracts are kept. You can undo this with Reactivate.
- **Reactivate** — restores access to an archived account with all contracts intact.
- **Make Administrator / Make Member** — changes the account's role.
- **Delete** — permanently removes an archived account and all its data. This cannot be undone. Only available for archived accounts.

The app always keeps at least one active administrator. Archive, demote, and delete actions are disabled for the last remaining admin to prevent the household from locking itself out.

> **Note**: when an account is permanently deleted, its email address is freed for re-use. If the address has already been reassigned to a new account (e.g. the person was re-invited), the old archived record shows "email reassigned" instead of the address, and Reactivate is no longer available.

### SMTP test (administrators only)

At the top of the **Accounts** page there is a **Send test email** panel. Enter any email address and click **Send** to check whether outgoing mail is configured correctly. Use this after changing your SMTP settings to verify delivery before inviting users.

---

## 11. Contract fields reference

| Field | Required | Constraints | Notes |
|-------|----------|-------------|-------|
| Name | Yes | 1–200 characters | Displayed with provider logo |
| Category | Yes | Utilities, Subscriptions, Insurance, Housing, Other | Used in dashboard breakdown |
| Amount | Yes | Number ≥ 0 | In your local currency |
| Billing interval | Yes | Weekly / Monthly / Quarterly / Yearly / Lifetime | Determines monthly equivalent |
| Status | Yes | Active / Inactive | Defaults to Active |
| Start date | No | YYYY-MM-DD | For your records |
| End date | No | YYYY-MM-DD | Drives renewal and expiry alerts |
| Cancellation notice | No | Positive integer + Days/Weeks/Months/Years | Shifts the deadline shown on the dashboard |
| Service URL | No | Valid URL | Link to your account page |
| Details | No | Up to 2 000 characters | Policy numbers, account IDs, notes |
| Anonymize | No | Boolean | Per-contract privacy flag |
