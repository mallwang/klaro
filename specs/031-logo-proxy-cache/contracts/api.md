# API Contracts: Logo Proxy with SQLite Cache

## GET /api/logos

Fetches a provider logo image, served from the local SQLite cache when available or proxied
from logo.dev on first request.

**Authentication**: None required (public route).

### Request

| Parameter | Location    | Type   | Required | Description                          |
|-----------|-------------|--------|----------|--------------------------------------|
| `name`    | Query string | string | Yes      | Provider/contract name to look up    |

**Example**:
```
GET /api/logos?name=Netflix
```

### Responses

| Status | Description                                                                 |
|--------|-----------------------------------------------------------------------------|
| 200    | Image bytes with `Content-Type` from logo.dev (e.g. `image/png`)           |
| 400    | `name` parameter missing or blank                                           |
| 502    | logo.dev returned a non-2xx response or was unreachable                     |

**200 Response**:

Binary image body. Headers include:
- `Content-Type`: MIME type as returned by logo.dev (forwarded verbatim)
- `Cache-Control`: `public, max-age=86400` (1 day browser cache)

**400 Response body**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "name is required"
}
```

**502 Response body**:
```json
{
  "statusCode": 502,
  "error": "Bad Gateway",
  "message": "Failed to fetch logo"
}
```

---

## DELETE /api/admin/logos/cache

Removes all entries from the logo cache. Subsequent logo requests will re-fetch from
logo.dev and repopulate the cache.

**Authentication**: Requires an active admin session (same session cookie as all other
admin routes). Returns `401` if unauthenticated, `403` if the authenticated user is not
an admin.

### Request

No body. No query parameters.

**Example**:
```
DELETE /api/admin/logos/cache
Cookie: session=<admin-session-id>
```

### Responses

| Status | Description                                       |
|--------|---------------------------------------------------|
| 200    | Cache cleared; response body contains row count   |
| 401    | No active session                                 |
| 403    | Authenticated user is not an admin                |

**200 Response body**:
```json
{
  "deleted": 42
}
```

Where `deleted` is the number of rows removed (0 when the cache was already empty).

---

## Frontend Integration

`ProviderLogo.tsx` constructs the proxy URL as:

```
/api/logos?name={encodeURIComponent(name)}
```

Used as an `<img src>` attribute — no fetch call or auth header needed. The browser's
native image loading handles the request. On non-2xx responses the `onError` handler
displays the building icon fallback.

The `logoUrl()` helper in `ProviderLogo.tsx` is updated to return this local URL instead
of the logo.dev URL. The `VITE_LOGO_DEV_TOKEN` env var is removed entirely from the
frontend.
