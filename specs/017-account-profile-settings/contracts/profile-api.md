# API Contracts: Profile Settings

**Branch**: `017-account-profile-settings` | **Date**: 2026-06-14

All endpoints are registered under the Fastify instance alongside existing routes. Authenticated endpoints require a valid `session_id` cookie (same as all other protected routes). The confirm endpoint is public — it is added to `PUBLIC_ROUTES` in `server.ts`.

---

## PATCH /api/profile

Update the authenticated user's display name.

**Authentication**: Required (any role)

**Request Body**:
```json
{ "displayName": "Jane Smith" }
```

| Field         | Type   | Constraints           |
|---------------|--------|-----------------------|
| `displayName` | string | min 1, max 100 chars  |

**Responses**:

| Status | Body | Description |
|--------|------|-------------|
| 204    | _(empty)_ | Display name updated |
| 400    | `{ statusCode, error, message }` | Validation failure |
| 401    | `{ statusCode, error, message }` | Not authenticated |

---

## POST /api/profile/email-change

Request an email address change. Sends a verification email to the new address.

**Authentication**: Required (any role)

**Request Body**:
```json
{ "email": "new@example.com" }
```

| Field   | Type   | Constraints                |
|---------|--------|----------------------------|
| `email` | string | valid email format, max 320 |

**Responses**:

| Status | Body | Description |
|--------|------|-------------|
| 202    | `{ "message": "Verification email sent" }` | Request accepted, email sent |
| 400    | `{ statusCode, error, message }` | Validation failure |
| 401    | `{ statusCode, error, message }` | Not authenticated |
| 409    | `{ statusCode, error, message }` | New email already in use by another account |
| 502    | `{ statusCode, error, message }` | Mailer failed; request rolled back |

---

## GET /api/profile/email-change/pending

Get the pending email address change for the authenticated user, if any.

**Authentication**: Required (any role)

**Request Body**: _(none)_

**Responses**:

| Status | Body | Description |
|--------|------|-------------|
| 200    | `{ "pendingEmail": "new@example.com" }` | A pending (non-expired) request exists |
| 200    | `{ "pendingEmail": null }` | No pending request |
| 401    | `{ statusCode, error, message }` | Not authenticated |

---

## POST /api/profile/email-change/:token/confirm

Confirm an email address change using the token from the verification email.

**Authentication**: **Not required** (public endpoint)

**URL Parameters**:

| Param   | Description                          |
|---------|--------------------------------------|
| `token` | 64-character hex token from email link |

**Request Body**: _(none)_

**Responses**:

| Status | Body | Description |
|--------|------|-------------|
| 200    | `{ "message": "Email address updated successfully" }` | Change confirmed |
| 404    | `{ statusCode, error, message }` | Token not found |
| 410    | `{ statusCode, error, message }` | Token expired |

---

## Verification Email Link Format

The verification link embedded in the email:

```
{APP_URL}/email-change/confirm/{token}
```

Where `APP_URL` defaults to `http://localhost:5173` (same pattern as invitation links). The frontend route `/email-change/confirm/:token` POSTs to `POST /api/profile/email-change/:token/confirm` on mount.
