# Feature Specification: Admin Diagnostics Page

**Feature Branch**: `037-admin-diagnostics`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Admin Diagnostics Page for custom web application - Build an admin-only diagnostics page that replicates the system health information shown in Vaultwarden's `/admin/diagnostics` view, covering versions, database status, reverse proxy configuration, internet connectivity, DNS resolution, and time synchronization."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin views overall system health at a glance (Priority: P1)

As an administrator, I want to open a single diagnostics page and immediately see whether the application, its database, and its deployment environment are healthy, so that I can confirm everything is working without SSH-ing into the server or digging through logs.

**Why this priority**: This is the core value of the feature — a one-stop health overview. Without this, none of the other stories have anywhere to live.

**Independent Test**: Can be fully tested by logging in as an administrator, navigating to the diagnostics page, and confirming that application version, database version, and runtime version are displayed correctly.

**Acceptance Scenarios**:

1. **Given** an administrator is signed in, **When** they open the diagnostics page, **Then** they see the running application version, the database engine version, and the runtime version clearly labeled.
2. **Given** the diagnostics page has loaded, **When** the administrator reviews the page, **Then** all information is organized into clearly labeled groups (e.g. versions vs. system/environment checks) so related facts are easy to scan.

---

### User Story 2 - Admin diagnoses deployment/environment issues (Priority: P2)

As an administrator, I want the diagnostics page to show environment-level facts (container status, reverse proxy detection, HTTPS status, domain match) so that I can quickly spot a misconfiguration after a deployment change (e.g. a proxy header missing, or the wrong domain being served).

**Why this priority**: Deployment misconfigurations (proxy headers, domain mismatches, missing HTTPS) are a common source of hard-to-diagnose production issues; surfacing them directly saves significant troubleshooting time.

**Independent Test**: Can be tested by deliberately introducing a known environment condition (e.g. an incorrect `DOMAIN` value, or removing a forwarded-IP header at the proxy) and confirming the diagnostics page flags the mismatch.

**Acceptance Scenarios**:

1. **Given** the application is running behind a reverse proxy with forwarded-IP headers, **When** the administrator loads the diagnostics page, **Then** it reports that a reverse proxy is detected and identifies which forwarded-IP header is present.
2. **Given** the configured domain does not match the `Host` header of the incoming request, **When** the administrator loads the diagnostics page, **Then** the domain configuration check is shown in a flagged/warning state with both values visible.
3. **Given** the request did not arrive over HTTPS, **When** the administrator loads the diagnostics page, **Then** the HTTPS check is shown as failing.

---

### User Story 3 - Admin diagnoses external connectivity issues (Priority: P3)

As an administrator, I want the diagnostics page to verify outbound internet access, DNS resolution, and server time synchronization, so that I can rule out (or confirm) external network problems as the cause of application issues (e.g. failed outbound email delivery, expired TLS certificate renewal, or scheduling bugs caused by clock drift).

**Why this priority**: These checks are valuable but address secondary/less frequent failure modes compared to core version info and deployment configuration; the page remains useful without them, but they add depth.

**Independent Test**: Can be tested by simulating a loss of outbound connectivity (e.g. blocking egress) and confirming the internet-access and DNS checks report failure without breaking the rest of the page.

**Acceptance Scenarios**:

1. **Given** the server has outbound internet access, **When** the administrator loads the diagnostics page, **Then** the internet access check reports success.
2. **Given** the server has no outbound internet access, **When** the administrator loads the diagnostics page, **Then** the internet access check reports failure while the rest of the page still renders normally.
3. **Given** the server's clock has drifted beyond the acceptable threshold from a trusted external time source, **When** the administrator loads the diagnostics page, **Then** the time-sync check is shown in a flagged/warning state with the measured drift.

---

### Edge Cases

- What happens when an external check (internet access, DNS resolution, time sync) does not respond within the configured timeout? It MUST be shown as a timed-out/degraded state rather than blocking the rest of the page from loading.
- What happens when a non-admin authenticated user, or an unauthenticated visitor, requests the diagnostics page/endpoint? Access MUST be denied.
- What happens when the database is unreachable at the moment the diagnostics page loads? The database version check MUST show a failed/error state rather than causing the whole page to error out.
- What happens when the client has JavaScript disabled? The page MUST still render a complete, readable diagnostics view via server-side output.
- What happens when none of the reverse-proxy headers are present (e.g. direct access bypassing the proxy)? The reverse-proxy check MUST report "not detected" rather than erroring.
- How does the page behave the very first time it's opened after a deployment restart, before any caching of check results has occurred? Every check MUST run fresh and complete within the overall timeout budget.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a diagnostics view accessible only to authenticated users with the administrator role; all other users (unauthenticated or non-admin) MUST be denied access.
- **FR-002**: The diagnostics view MUST display the currently running application version.
- **FR-003**: The diagnostics view MUST display the current database engine version.
- **FR-004**: The diagnostics view MUST display the currently installed runtime (Node.js) version.
- **FR-005**: The diagnostics view MUST report the host operating system platform and processor architecture.
- **FR-006**: The diagnostics view MUST report whether the application is currently running inside a container.
- **FR-007**: The diagnostics view MUST report whether the incoming request shows evidence of passing through a reverse proxy, and if so, which specific forwarded-IP indicator was present.
- **FR-008**: The diagnostics view MUST report whether the server currently has outbound internet access, based on a live check against a known external address, and MUST NOT let this check block the rest of the page beyond the configured timeout.
- **FR-009**: The diagnostics view MUST report whether DNS resolution is functioning, based on a live lookup of a known external hostname, showing the resolved address on success or a failure indicator otherwise.
- **FR-010**: The diagnostics view MUST report whether real-time (WebSocket) support is enabled in the current server configuration.
- **FR-011**: The diagnostics view MUST display the current server date/time in UTC and in the server's local timezone.
- **FR-012**: The diagnostics view MUST report whether the server's clock is synchronized within an acceptable threshold of a trusted external time source, flagging the check when drift exceeds that threshold.
- **FR-013**: The diagnostics view MUST compare the application's configured public domain against the domain the incoming request was addressed to, and flag a mismatch when they differ.
- **FR-014**: The diagnostics view MUST report whether the current request was received over a secure (HTTPS) connection.
- **FR-015**: The diagnostics view MUST NOT reveal secret values (credentials, tokens, API keys, connection strings, or similar sensitive configuration) in its output.
- **FR-016**: Every individual check MUST complete or time out within a configurable maximum duration (defaulting to 5 seconds) so that a slow or unresponsive check cannot delay the rest of the page indefinitely.
- **FR-017**: If an individual check fails or times out, the diagnostics view MUST show that specific check in a clearly marked degraded/error state while all other checks continue to display normally; a single check failure MUST NOT prevent the page from loading.
- **FR-018**: The diagnostics view MUST be fully readable and usable when the client has JavaScript disabled, via a server-rendered fallback.
- **FR-019**: The diagnostics view MUST present its information grouped into a versions section and a system/environment checks section, matching the categories described in this specification.

### Key Entities

- **Diagnostics Report**: A point-in-time snapshot of system health, composed of a versions group (application, database, runtime) and a system-checks group (platform/architecture, container status, reverse-proxy detection, forwarded-IP header, internet access, DNS resolution, WebSocket support, server date/time, time-sync drift, domain-configuration match, HTTPS status). Each check result carries a status (ok / warning / failed / timed-out) and a human-readable detail value. Not persisted — generated fresh on each request.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can determine overall system health (versions + all environment checks) by viewing a single page, with no need to inspect server logs or open a remote shell.
- **SC-002**: The diagnostics page fully loads and renders within 6 seconds even when one or more external checks (internet access, DNS, time sync) are slow or unresponsive.
- **SC-003**: When any single check fails, 100% of the remaining checks on the page still display their correct results — a failure in one check never blanks or crashes the page.
- **SC-004**: Non-admin users attempting to access the diagnostics page are denied access in 100% of attempts.
- **SC-005**: No secret or credential values appear in the diagnostics output in any scenario.
- **SC-006**: The page's information remains fully readable with JavaScript disabled, with no missing sections compared to the JavaScript-enabled view.

## Assumptions

- The application already has an established administrator role and an authentication mechanism that can be reused to gate access to this page (confirmed: the existing system already distinguishes an `ADMIN` role from regular users).
- The database engine in use is SQLite, and its version can be obtained via a direct query against the running database.
- "A known external address/hostname" for the internet-access and DNS checks refers to a stable, well-known public host (e.g. a major public site) chosen at implementation time; the exact host is an implementation detail, not a product decision.
- The acceptable clock-drift threshold is a configurable value with a reasonable default (e.g. a few seconds); the exact default is an implementation detail.
- The diagnostics view is read-only — it reports state but does not offer remediation actions (e.g. restarting services) from within the page.
- Historical/trend data is out of scope for this feature; only the current, live snapshot at page-load time is required.
- The page is intended for a single administrator or small admin group checking system health occasionally, not for continuous automated monitoring or alerting integration.
