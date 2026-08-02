# CodeSpace API — Authentication Module Documentation (`/api/v1/auth`)

This document provides detailed API specifications, response envelope structures, payload examples, and error scenarios for all authentication endpoints in `code-space-api`.

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
    "path": "/api/v1/auth/<endpoint>"
  }
}
```

---

## Authentication Endpoints Overview

| Endpoint                       | Method | Status |   Auth    | Success Message (`message`)             |  Rate Limit  |
| :----------------------------- | :----: | :----: | :-------: | :-------------------------------------- | :----------: |
| `/api/v1/auth/login`           | `POST` | `200`  |  ❌ None  | `Login successfully`                    | 10 req / 60s |
| `/api/v1/auth/register`        | `POST` | `201`  |  ❌ None  | `Register account successfully`         | 10 req / 60s |
| `/api/v1/auth/verify-email`    | `POST` | `200`  |  ❌ None  | `Verify email successfully`             | 10 req / 60s |
| `/api/v1/auth/refresh`         | `POST` | `200`  | 🍪 Cookie | `Refresh access token successfully`     |    Global    |
| `/api/v1/auth/logout`          | `POST` | `204`  | 🔒 Bearer | `Logout successfully`                   |    Global    |
| `/api/v1/auth/forgot-password` | `POST` | `200`  |  ❌ None  | `Send password reset code successfully` | 10 req / 60s |
| `/api/v1/auth/reset-password`  | `POST` | `200`  |  ❌ None  | `Reset password successfully`           | 10 req / 60s |

---

## Response Data Examples by Endpoint

### `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "email": "developer@codespace.dev",
  "password": "Password123",
  "deviceName": "Windows Workstation Desktop"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "1",
      "email": "developer@codespace.dev",
      "name": "Alex Dev",
      "avatarUrl": null,
      "role": "USER"
    }
  },
  "message": "Login successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/login" }
}
```

> A 7-day `refreshToken` HTTP-only cookie is also set on the response.

---

### `POST /api/v1/auth/register`

**Request Body:**

```json
{
  "name": "Alex Dev",
  "email": "developer@codespace.dev",
  "password": "Password123"
}
```

**Password Requirements**: min 6 chars, at least 1 uppercase, 1 lowercase, 1 digit.

**Response (`201 Created`):**

```json
{
  "status": "success",
  "data": {
    "id": "2",
    "email": "developer@codespace.dev",
    "name": "Alex Dev",
    "avatarUrl": null,
    "role": "USER",
    "createdAt": "2026-08-01T13:00:00.000Z"
  },
  "message": "Register account successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/register" }
}
```

> A verification OTP email is dispatched asynchronously in the background. The HTTP response returns immediately without waiting.

---

### `POST /api/v1/auth/verify-email`

**Request Body:**

```json
{
  "email": "developer@codespace.dev",
  "code": "123456"
}
```

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Verify email successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/verify-email" }
}
```

---

### `POST /api/v1/auth/refresh`

Requires the `refreshToken` HTTP-only cookie set during login.

**Response:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "Refresh access token successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/refresh" }
}
```

> The old refresh token is revoked and a new one is issued (token rotation).

---

### `POST /api/v1/auth/logout`

Requires `Authorization: Bearer <accessToken>`.

**Response (`204 No Content`):** Empty body. Revokes current refresh session in database and clears the `refreshToken` HTTP-only cookie (`path: /api/v1`).

---

### `POST /api/v1/auth/forgot-password`

**Request Body:**

```json
{
  "email": "developer@codespace.dev"
}
```

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Send password reset code successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/forgot-password" }
}
```

> Returns `404 Not Found` if the email is not registered. OTP email is dispatched asynchronously.

---

### `POST /api/v1/auth/reset-password`

**Request Body:**

```json
{
  "email": "developer@codespace.dev",
  "code": "654321",
  "newPassword": "NewPassword123"
}
```

**Password Requirements**: min 6 chars, at least 1 uppercase, 1 lowercase, 1 digit.

**Response:**

```json
{
  "status": "success",
  "data": null,
  "message": "Reset password successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1", "path": "/api/v1/auth/reset-password" }
}
```

---

## Error Messages & Scenarios

When an error occurs, the global `HttpExceptionFilter` formats it as:

```json
{
  "status": "error",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "meta": {
    "timestamp": 1785564382331,
    "path": "/api/v1/auth/login"
  }
}
```

| Scenario                     | Triggering Endpoint          | HTTP Code | Error Code (`code`)         | Error Message (`message`)                             |
| :--------------------------- | :--------------------------- | :-------: | :-------------------------- | :---------------------------------------------------- |
| Invalid Email/Password       | `POST /auth/login`           |   `401`   | `INVALID_CREDENTIALS`       | `Invalid email or password`                           |
| Duplicate Email              | `POST /auth/register`        |   `409`   | `EMAIL_ALREADY_EXISTS`      | `Email already registered`                            |
| Invalid OTP Code             | `POST /auth/verify-email`    |   `401`   | `INVALID_VERIFICATION_CODE` | `Invalid, expired, or already used verification code` |
| Missing Refresh Cookie       | `POST /auth/refresh`         |   `401`   | `MISSING_REFRESH_TOKEN`     | `Refresh token not provided`                          |
| Session Expired / Revoked    | `POST /auth/refresh`         |   `401`   | `INVALID_SESSION`           | `Session expired or invalid`                          |
| Email Not Registered         | `POST /auth/forgot-password` |   `404`   | `NOT_FOUND`                 | `Email not registered`                                |
| Invalid / Expired Reset Code | `POST /auth/reset-password`  |   `401`   | `INVALID_VERIFICATION_CODE` | `Invalid or expired reset code`                       |
| Invalid Bearer Token         | `POST /auth/logout`          |   `401`   | `UNAUTHORIZED`              | `Unauthorized`                                        |
