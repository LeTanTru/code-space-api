# CodeSpace API — Account & Session Module Documentation

This document provides detailed API specifications, response envelope structures, payload examples, and error scenarios for account management (`/api/v1/account`) and session management (`/api/v1/account/session`) endpoints.

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
    "path": "/api/v1/account/<endpoint>"
  }
}
```

---

## Account Endpoints Overview

| Endpoint                          |  Method  | Status |   Auth    | Success Message (`message`)                |  Rate Limit  |
| :-------------------------------- | :------: | :----: | :-------: | :----------------------------------------- | :----------: |
| `/api/v1/account/profile`         |  `GET`   | `200`  | 🔒 Bearer | `Get account profile successfully`         |    Global    |
| `/api/v1/account/update/profile`  |  `PUT`   | `200`  | 🔒 Bearer | `Update account profile successfully`      |    Global    |
| `/api/v1/account/change-password` |  `POST`  | `200`  | 🔒 Bearer | `Change password successfully`             | 10 req / 60s |
| `/api/v1/account/delete`          | `DELETE` | `204`  | 🔒 Bearer | `Delete account successfully`              | 10 req / 60s |
| `/api/v1/session/list`            |  `GET`   | `200`  | 🔒 Bearer | `Get list of active sessions successfully` |    Global    |
| `/api/v1/session/delete/:id`      | `DELETE` | `204`  | 🔒 Bearer | `Delete session successfully`              |    Global    |

> Session endpoints are handled by `SessionController` in `src/modules/session/` under the `/api/v1/session` prefix.

---

## Response Data Examples by Endpoint

### `GET /api/v1/account/profile`

```json
{
  "status": "success",
  "data": {
    "id": "1",
    "email": "developer@codespace.dev",
    "name": "Alex Dev",
    "avatarUrl": null,
    "role": "USER",
    "activeSessions": [
      {
        "id": "10",
        "deviceName": "Windows Workstation",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0)",
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-08-01T11:45:00.000Z",
        "expiresAt": "2026-08-08T11:45:00.000Z"
      }
    ]
  },
  "message": "Get account profile successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/account/profile" }
}
```

---

### `PUT /api/v1/account/update/profile`

**Request Body (all fields optional):**

```json
{
  "name": "Alex Dev Updated",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "1",
    "email": "developer@codespace.dev",
    "name": "Alex Dev Updated",
    "avatarUrl": "https://example.com/avatar.png",
    "role": "USER",
    "activeSessions": [...]
  },
  "message": "Update account profile successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/account/update/profile" }
}
```

---

### `POST /api/v1/account/change-password`

**Request Body:**

```json
{
  "oldPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Password Requirements**: min 6 chars, at least 1 uppercase, 1 lowercase, 1 digit.

**Response:**

```json
{
  "status": "success",
  "data": { "message": "Change password successfully" },
  "message": "Change password successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/account/change-password" }
}
```

> All active refresh sessions are revoked after a successful password change, forcing re-login on all devices.

---

### `DELETE /api/v1/account/delete`

**Request Body:**

```json
{
  "password": "CurrentPassword123"
}
```

**Response (`204 No Content`):** Empty body. All user data is permanently deleted, active sessions are cascade-revoked, and the `refreshToken` HTTP-only cookie is cleared on the client.

---

### `GET /api/v1/session/list`

```json
{
  "status": "success",
  "data": [
    {
      "id": "10",
      "deviceName": "Windows Workstation",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0)",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-08-01T11:45:00.000Z",
      "expiresAt": "2026-08-08T11:45:00.000Z"
    }
  ],
  "message": "Get list of active sessions successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/session/list" }
}
```

Only non-revoked, non-expired sessions are returned, ordered by `createdAt` descending.

---

### `DELETE /api/v1/session/delete/:id`

**Response (`204 No Content`):** Empty body. Session is revoked immediately.

> Session lookup is scoped to the authenticated user's `userId` (prevents IDOR). See [session-api.md](session-api.md) for full details.

---

## Error Messages & Scenarios

When an error occurs, the global `HttpExceptionFilter` formats it as:

```json
{
  "status": "error",
  "code": "INCORRECT_PASSWORD",
  "message": "Incorrect current password",
  "meta": {
    "timestamp": 1785564382331,
    "path": "/api/v1/account/change-password"
  }
}
```

| Scenario                    | Triggering Endpoint             | HTTP Code | Error Code (`code`)  | Error Message (`message`)    |
| :-------------------------- | :------------------------------ | :-------: | :------------------- | :--------------------------- |
| Wrong Current Password      | `POST /account/change-password` |   `401`   | `INCORRECT_PASSWORD` | `Incorrect current password` |
| Wrong Password on Deletion  | `DELETE /account/delete`        |   `401`   | `INCORRECT_PASSWORD` | `Incorrect password`         |
| Session Not Found / Unowned | `DELETE /session/delete/:id`    |   `404`   | `SESSION_NOT_FOUND`  | `Session not found`          |
| Invalid Bearer Token        | Any protected route             |   `401`   | `UNAUTHORIZED`       | `Unauthorized`               |
