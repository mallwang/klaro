# API Contract: Delete Account

**Endpoint**: `DELETE /api/profile`

**Authentication**: Required — session cookie (`pcm_session`). Returns 401 if unauthenticated.

## Request

No request body.

## Responses

### 204 No Content — Account deleted

The account and all associated data have been permanently deleted.
The response clears the session cookie.

```http
HTTP/1.1 204 No Content
Set-Cookie: pcm_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax
```

### 409 Conflict — Sole administrator

The requesting user is the only active administrator. Deletion is blocked until another
user is promoted to administrator.

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Cannot delete the last active administrator account"
}
```

### 401 Unauthorized — Not authenticated

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

## Frontend behaviour on each response

| Status | Frontend action |
|--------|----------------|
| 204 | Clear query cache, navigate to `/sign-in` |
| 409 | Close modal, show inline error in Danger Zone explaining the sole-admin restriction |
| 401 | Navigate to `/sign-in` (session expired mid-flow) |
| 5xx | Show error alert inside modal; account is intact |

## Zod schema (shared package)

```typescript
// packages/shared/src/schemas/profile.ts
export const DeleteSelfResultSchema = z.union([
  z.literal('deleted'),
  z.literal('last-admin'),
]);
export type DeleteSelfResult = z.infer<typeof DeleteSelfResultSchema>;
```
