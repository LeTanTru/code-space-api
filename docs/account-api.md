# CodeSpace API — Account Management Module Documentation (`/api/v1/account`)

This document provides detailed API specifications, response envelope structures, payload examples, and error scenarios for all account management endpoints in `code-space-api`.

---

## Response Envelope Structure

All successful responses are automatically formatted by the global `ResponseInterceptor` into the standardized envelope structure:

```json
{
  "status": "success",
  "data": { ... },
  "message": "<custom_endpoint_message>",
  "meta": {
    "timestamp": 1785564382331,
    "version": "v1"
  }
}
```

---

## Account Endpoints Overview

| Endpoint                             |    Method     | Status |   Auth    | Success Message (`message`)                | Implementation State |
| :----------------------------------- | :-----------: | :----: | :-------: | :----------------------------------------- | :------------------: |
| `/api/v1/account/profile`            |     `GET`     | `200`  | 🔒 Bearer | `Get account profile successfully`         |    ✅ Implemented    |
| `/api/v1/account/profile`            | `PUT`/`PATCH` | `200`  | 🔒 Bearer | `Update account profile successfully`      |    ✅ Implemented    |
| `/api/v1/account/change-password`    | `POST`/`PUT`  | `200`  | 🔒 Bearer | `Change password successfully`             |    ✅ Implemented    |
| `/api/v1/account/session`            |     `GET`     | `200`  | 🔒 Bearer | `Get list of active sessions successfully` |    ✅ Implemented    |
| `/api/v1/account/session/delete/:id` |   `DELETE`    | `204`  | 🔒 Bearer | `Delete session successfully`              |    ✅ Implemented    |
| `/api/v1/account/delete`             |   `DELETE`    | `204`  | 🔒 Bearer | `Delete account successfully`              |    ✅ Implemented    |

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
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `PUT /api/v1/account/profile`

```json
{
  "status": "success",
  "data": {
    "id": "1",
    "email": "developer@codespace.dev",
    "name": "Alex Dev Updated",
    "avatarUrl": "https://example.com/avatar.png",
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
  "message": "Update account profile successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/account/change-password`

```json
{
  "status": "success",
  "data": { "message": "Change password successfully" },
  "message": "Change password successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `GET /api/v1/account/session`

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
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

---

## Error Messages & Scenarios

When an error occurs, the global `HttpExceptionFilter` formats errors into:

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

| Scenario                    | Triggering Endpoint                  | HTTP Code | Error Code (`code`)  | Error Message (`message`)    |
| :-------------------------- | :----------------------------------- | :-------: | :------------------- | :--------------------------- |
| Wrong Current Password      | `POST /account/change-password`      |   `401`   | `INCORRECT_PASSWORD` | `Incorrect current password` |
| Wrong Password on Deletion  | `DELETE /account/delete`             |   `401`   | `INCORRECT_PASSWORD` | `Incorrect password`         |
| Session Not Found / Unowned | `DELETE /account/session/delete/:id` |   `404`   | `SESSION_NOT_FOUND`  | `Session not found`          |
| Invalid Bearer Token        | Any protected route                  |   `401`   | `UNAUTHORIZED`       | `Unauthorized`               |
