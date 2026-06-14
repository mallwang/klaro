# API Contracts: Email Enhancements (018)

## New endpoint

### `POST /api/admin/email/test`

Send a diagnostic test email to verify SMTP configuration is working.

**Authentication**: Session cookie required. Caller must have role `ADMIN`. Non-admins
receive `403 Forbidden`.

**Request body**:
```json
{ "email": "recipient@example.com" }
```

| Field | Type   | Required | Constraints                        |
|-------|--------|----------|------------------------------------|
| email | string | yes      | Valid email address, max 320 chars |

**Responses**:

| Status | Body | Meaning |
|--------|------|---------|
| `200 OK` | `{ "message": "Test email sent" }` | Email was accepted by the SMTP server |
| `400 Bad Request` | `{ "statusCode": 400, "error": "Bad Request", "message": "..." }` | Validation failure (missing or malformed email) |
| `403 Forbidden` | `{ "statusCode": 403, "error": "Forbidden", "message": "Administrator access required" }` | Caller is not an admin |
| `502 Bad Gateway` | `{ "statusCode": 502, "error": "Bad Gateway", "message": "..." }` | SMTP transport rejected or is unreachable |

---

## Changed endpoint behaviour (no breaking change)

### `POST /api/invitations/:token/accept`

Existing behaviour: activates the user account and returns the session user.

**New side-effect**: After the account is activated, a welcome confirmation email is sent to
the invitee's address (fire-and-forget). The response contract is unchanged; the caller
cannot observe whether the confirmation email was sent.

### `POST /api/profile/email-change/:token/confirm`

Existing behaviour: confirms the email-address change and returns `{ "message": "Email
address updated successfully" }`.

**New side-effect**: After the email address is updated, a confirmation email is sent to the
newly active address (fire-and-forget). The response contract is unchanged.

---

## Frontend service additions

### `sendTestEmail(email: string): Promise<void>`

Calls `POST /api/admin/email/test`. Throws `AuthError` on non-2xx response.

Location: `packages/frontend/src/services/users.ts` (admin-scoped service file).
