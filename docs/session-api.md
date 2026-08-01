# CodeSpace API — Session Management Module Documentation (`/api/v1/session`)

This document provides detailed API specifications, response envelope structures, payload examples, and error scenarios for all session management endpoints in `code-space-api`.

Session endpoints are handled by `SessionController` (`src/modules/session/session.controller.ts`) and `SessionService` (`src/modules/session/session.service.ts`), which are registered under `SessionModule`.

---

## Response Envelope Structure

All successful responses are automatically formatted by the global `ResponseInterceptor`:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<endpoint-specific-message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1",
    "path": "/api/v1/account/session/<endpoint>"
  }
}
```

---

## Session Endpoints Overview

| Endpoint                     |  Method  | Status |   Auth    | Success Message (`message`)                | Rate Limit |
| :--------------------------- | :------: | :----: | :-------: | :----------------------------------------- | :--------: |
| `/api/v1/session/list`       |  `GET`   | `200`  | 🔒 Bearer | `Get list of active sessions successfully` |   Global   |
| `/api/v1/session/delete/:id` | `DELETE` | `204`  | 🔒 Bearer | `Delete session successfully`              |   Global   |

All session endpoints require a valid `Authorization: Bearer <accessToken>` header.

---

## What Is a Session?

A **session** corresponds to a refresh token record stored in the `refresh_tokens` database table. When a user logs in, a session is created. Sessions store:

- The device name the user provided at login (`deviceName`)
- The HTTP User-Agent string of the client (`userAgent`)
- The client IP address (`ipAddress`)
- Creation timestamp (`createdAt`)
- Expiration timestamp (`expiresAt`) — sessions expire after 7 days

A session is considered **active** when:

- `revokedAt` is `null` (not manually revoked)
- `expiresAt` is in the future (not expired)

---

## Response Data Examples by Endpoint

### `GET /api/v1/session/list`

Returns all active (non-revoked, non-expired) sessions for the authenticated user, ordered by most recently created first.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "10",
      "deviceName": "Windows Workstation Desktop",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-08-01T11:45:00.000Z",
      "expiresAt": "2026-08-08T11:45:00.000Z"
    },
    {
      "id": "9",
      "deviceName": "MacBook Pro",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-07-30T08:12:00.000Z",
      "expiresAt": "2026-08-06T08:12:00.000Z"
    }
  ],
  "message": "Get list of active sessions successfully",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1",
    "path": "/api/v1/session/list"
  }
}
```

**Session Response DTO fields:**

| Field        | Type             | Description                                                |
| :----------- | :--------------- | :--------------------------------------------------------- |
| `id`         | `string`         | BigInt session ID serialized to string                     |
| `deviceName` | `string \| null` | Device name provided at login (`deviceName` in `LoginDto`) |
| `userAgent`  | `string \| null` | HTTP User-Agent string of the login client                 |
| `ipAddress`  | `string \| null` | IP address of the login client                             |
| `createdAt`  | `string`         | ISO 8601 timestamp of session creation                     |
| `expiresAt`  | `string`         | ISO 8601 timestamp of session expiration                   |

---

### `DELETE /api/v1/session/delete/:id`

Revokes a specific session by its ID. The session must belong to the authenticated user (IDOR-safe lookup via JWT `userId`).

**Path Parameter:**

| Parameter | Type     | Description                                            |
| :-------- | :------- | :----------------------------------------------------- |
| `id`      | `string` | The session ID to revoke (BigInt serialized as string) |

**Example Request:**

```http
DELETE /api/v1/session/delete/10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

**Response (`204 No Content`):** Empty body. The session's `revokedAt` is set to the current timestamp, making it immediately invalid for future refresh token use.

---

## IDOR Protection

Session revocation queries are always scoped to **both** the session ID and the authenticated user's ID from the JWT:

```prisma
refreshToken.updateMany({
  where: {
    id: sessionId,     // target session
    userId: userId,    // must belong to authenticated user
    revokedAt: null,   // must not already be revoked
  },
  data: { revokedAt: new Date() },
})
```

If `count === 0` (session not found or doesn't belong to user), a `404 Not Found` is returned. This prevents users from revoking other users' sessions.

---

## Error Messages & Scenarios

When an error occurs, the global `HttpExceptionFilter` formats it as:

```json
{
  "status": "error",
  "code": "SESSION_NOT_FOUND",
  "message": "Session not found",
  "meta": {
    "timestamp": 1785564382331,
    "path": "/api/v1/session/delete/999"
  }
}
```

| Scenario                       | Triggering Endpoint          | HTTP Code | Error Code (`code`) | Error Message (`message`) |
| :----------------------------- | :--------------------------- | :-------: | :------------------ | :------------------------ |
| Session not found or not owned | `DELETE /session/delete/:id` |   `404`   | `SESSION_NOT_FOUND` | `Session not found`       |
| Missing / expired Bearer token | Any session endpoint         |   `401`   | `UNAUTHORIZED`      | `Unauthorized`            |

---

## Related Docs

- [auth-api.md](auth-api.md) — Login (`POST /auth/login`) creates a session; Logout (`POST /auth/logout`) revokes the current session; Refresh (`POST /auth/refresh`) rotates the current session's token.
- [account-api.md](account-api.md) — Change password (`POST /account/change-password`) revokes **all** active sessions.
