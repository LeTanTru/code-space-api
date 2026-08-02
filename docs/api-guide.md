# API Guide

## Base URL & Auth Headers

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Auth Header**: `Authorization: Bearer <AccessToken>`
- **Interactive Docs**: Available at `/api/docs` (Swagger UI) when server is running.

---

## Response Envelope Standards

All HTTP responses returned by `code-space-api` follow standardized JSON structures for seamless desktop application integration.

### Success Response Format

```json
{
  "status": "success",
  "data": { ... },
  "message": "Login successfully",
  "meta": {
    "timestamp": 1785568167359,
    "version": "v1",
    "path": "/api/v1/auth/login"
  }
}
```

> `message` is set per-endpoint via `@ResponseMessage('...')`. If the decorator is absent, the field is omitted from the response.

> `meta.path` reflects the actual request path at runtime.

### Error Response Format

Error responses omit `data` and return a domain-specific `code` string for application error handling:

```json
{
  "status": "error",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "meta": {
    "timestamp": 1785568167359,
    "path": "/api/v1/auth/login"
  }
}
```

---

## Application Error Codes (`ERROR_CODES`)

Below is the dictionary of standardized `code` values returned in error payloads (`src/constants/error-code.ts`):

| Error Code                  | HTTP Status | Description                                                                 |
| :-------------------------- | :---------: | :-------------------------------------------------------------------------- |
| `VALIDATION_ERROR`          |    `400`    | Request body validation failed (e.g. invalid email format, short password)  |
| `BAD_REQUEST`               |    `400`    | Malformed request or illegal argument                                       |
| `INVALID_CREDENTIALS`       |    `401`    | Authentication failed due to wrong email or password                        |
| `INVALID_VERIFICATION_CODE` |    `401`    | Invalid, expired, or already used email OTP verification code               |
| `INCORRECT_PASSWORD`        |    `401`    | Incorrect current password provided for password change or account deletion |
| `MISSING_REFRESH_TOKEN`     |    `401`    | Refresh token HTTP-only cookie missing                                      |
| `INVALID_SESSION`           |    `401`    | Refresh token expired, revoked, or session invalid                          |
| `UNAUTHORIZED`              |    `401`    | Bearer access token missing or expired                                      |
| `FORBIDDEN`                 |    `403`    | Access to target resource is forbidden                                      |
| `NOT_FOUND`                 |    `404`    | Requested API resource path not found                                       |
| `USER_NOT_FOUND`            |    `404`    | Target user account does not exist                                          |
| `SESSION_NOT_FOUND`         |    `404`    | Target session ID not found or already deleted                              |
| `EMAIL_ALREADY_EXISTS`      |    `409`    | Email address is already registered                                         |
| `RESOURCE_CONFLICT`         |    `409`    | Conflict with existing resource state                                       |
| `TOO_MANY_REQUESTS`         |    `429`    | Client exceeded rate limit threshold                                        |
| `INTERNAL_SERVER_ERROR`     |    `500`    | Unexpected server exception                                                 |

---

## Endpoint Modules Overview

Detailed REST endpoint contracts are documented in module-specific guides:

- **Authentication**: [`docs/auth-api.md`](auth-api.md) — `login`, `register`, `verify-email`, `refresh`, `logout`, `forgot-password`, `reset-password`
- **Account Management**: [`docs/account-api.md`](account-api.md) — `GET profile`, `PUT update/profile`, `POST change-password`, `DELETE delete`
- **Session Management**: [`docs/session-api.md`](session-api.md) — `GET session/list`, `DELETE session/delete/:id`
- **Workspace Sync**: [`docs/workspace-api.md`](workspace-api.md) — `GET`, `POST`, `PUT`, `DELETE /workspaces`
- **Layout Presets**: [`docs/preset-api.md`](preset-api.md) — `GET`, `POST`, `PUT`, `DELETE /presets`
- **Settings Sync**: [`docs/settings-api.md`](settings-api.md) — `GET`, `PUT /settings`
- **Full State Backup**: [`docs/sync-api.md`](sync-api.md) — `POST /sync/push`, `GET /sync/pull`
- **Health Indicators**: [`docs/health-api.md`](health-api.md) — `GET /health`
- **Rate Limiting**: [`docs/rate-limiter.md`](rate-limiter.md) — Throttling limits & HTTP 429 specs
