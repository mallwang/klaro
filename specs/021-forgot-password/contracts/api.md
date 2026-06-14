# API Contracts: Forgot Password (021)

## POST /api/auth/forgot-password

**Public endpoint** — no authentication required.

### Request

```json
{
  "email": "user@example.com"
}
```

| Field  | Type              | Required | Constraints       |
|--------|-------------------|----------|-------------------|
| email  | string (email)    | yes      | valid RFC 5321 address |

### Response (202 Accepted)

```json
{
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Always returns 202**, regardless of whether the email exists in the system. This prevents email enumeration attacks.

### Errors

| Status | Body | When |
|--------|------|------|
| 400 | `{ "statusCode": 400, "error": "Bad Request", "message": "Invalid email" }` | Invalid email format |

### Notes

- If email exists: generates token, sends email, returns 202
- If email not found: returns 202 without sending email
- Previous password-reset tokens for the user are invalidated

---

## POST /api/auth/reset-password/:token

**Public endpoint** — no authentication required.

### Request

```json
{
  "password": "new-secure-password"
}
```

| Field    | Type              | Required | Constraints       |
|----------|-------------------|----------|-------------------|
| password | string            | yes      | min 8, max 200 chars |

### Response (200 OK)

```json
{
  "message": "Password has been reset successfully"
}
```

### Errors

| Status | Body | When |
|--------|------|------|
| 400 | `{ "statusCode": 400, "error": "Bad Request", "message": "Password must be at least 8 characters" }` | Password too short |
| 404 | `{ "statusCode": 404, "error": "Not Found", "message": "Invalid or expired reset link" }` | Token not found or expired |
| 410 | `{ "statusCode": 410, "error": "Gone", "message": "This link has expired" }` | Token expired (optional — 404 is also acceptable) |

### Notes

- Token is single-use — deleted after successful password reset
- Invalid or expired tokens return 404 (not 410) to avoid leaking token validity
- Password is validated against strength requirements (min 8 chars)
- User's `password_hash` and `password_salt` are updated

---

## Email Template

### Password Reset Email

**Subject**: Reset your password

**Body (text)**:
```
You requested a password reset.

Click the link below to set a new password:

{link}

This link expires on {expiryDate}. It can only be used once.

If you did not request this change, you can ignore this email.
```

**Body (html)**:
```html
<p>You requested a password reset.</p>
<p>Click the link below to set a new password:</p>
<p><a href="{link}">{link}</a></p>
<p>This link expires on <strong>{expiryDate}</strong>. It can only be used once.</p>
<p>If you did not request this change, you can ignore this email.</p>
```

---

## Frontend Routes

### GET /forgot-password

**Public route** — renders `ForgotPassword.tsx` component.

### GET /reset-password/:token

**Public route** — renders `ResetPassword.tsx` component.
