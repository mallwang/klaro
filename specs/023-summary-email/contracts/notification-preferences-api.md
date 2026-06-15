# API Contract: Notification Preferences

All endpoints require an active session cookie (`pcm_session`). Requests without a valid session return `401 Unauthorized`.

---

## GET /api/profile/notification-preferences

Returns the authenticated user's email summary preferences and the computed next send datetime.

### Response `200 OK`

```json
{
  "summaryEmailEnabled": false,
  "summaryEmailFrequency": null,
  "nextSendAt": null
}
```

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "WEEKLY",
  "nextSendAt": "2026-06-16T10:00:00.000Z"
}
```

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "MONTHLY",
  "nextSendAt": "2026-07-01T10:00:00.000Z"
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `summaryEmailEnabled` | `boolean` | Whether the user has opted into summary emails |
| `summaryEmailFrequency` | `"WEEKLY" \| "MONTHLY" \| null` | Delivery frequency; `null` when disabled |
| `nextSendAt` | `string (ISO 8601 UTC) \| null` | Next scheduled send datetime; `null` when disabled |

---

## PATCH /api/profile/notification-preferences

Updates the authenticated user's email summary preferences.

### Request Body

```json
{
  "summaryEmailEnabled": true,
  "summaryEmailFrequency": "MONTHLY"
}
```

```json
{
  "summaryEmailEnabled": false
}
```

### Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `summaryEmailEnabled` | `boolean` | Yes | Enable or disable summary emails |
| `summaryEmailFrequency` | `"WEEKLY" \| "MONTHLY"` | When `summaryEmailEnabled` is `true` | Delivery cadence |

### Validation Rules

- `summaryEmailFrequency` MUST be present when `summaryEmailEnabled` is `true`; omitted or `null` when `false`.
- `summaryEmailFrequency` MUST be `"WEEKLY"` or `"MONTHLY"` when provided.

### Responses

| Status | Meaning |
|---|---|
| `204 No Content` | Preferences updated successfully |
| `400 Bad Request` | Validation failure (e.g., enabled without frequency, unknown frequency value) |
| `401 Unauthorized` | No valid session |

### Error Body (`400`)

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "summaryEmailFrequency is required when summaryEmailEnabled is true"
}
```
