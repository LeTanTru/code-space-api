# CodeSpace API — Authentication Module Documentation (`/api/v1/auth`)

This document provides detailed API specifications, response envelope structures, payload examples, and error scenarios for all authentication endpoints in `code-space-api`.

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

## Authentication Endpoints Overview

| Endpoint                       | Method | Status |   Auth    | Success Message (`message`)                                                        | Implementation State |
| :----------------------------- | :----: | :----: | :-------: | :--------------------------------------------------------------------------------- | :------------------: |
| `/api/v1/auth/login`           | `POST` | `200`  |  ❌ None  | `Logged in successfully`                                                           |    ✅ Implemented    |
| `/api/v1/auth/register`        | `POST` | `201`  |  ❌ None  | `Account created successfully. Please check your email for the verification code.` |    ✅ Implemented    |
| `/api/v1/auth/verify-email`    | `POST` | `200`  |  ❌ None  | `Email verified successfully`                                                      |    ✅ Implemented    |
| `/api/v1/auth/refresh`         | `POST` | `200`  | 🍪 Cookie | `Access token refreshed successfully`                                              |    ✅ Implemented    |
| `/api/v1/auth/logout`          | `POST` | `204`  | 🔒 Bearer | `Logged out successfully`                                                          |    ✅ Implemented    |
| `/api/v1/auth/forgot-password` | `POST` | `200`  |  ❌ None  | `If this email is registered, a reset code has been sent`                          |    ✅ Implemented    |
| `/api/v1/auth/reset-password`  | `POST` | `200`  |  ❌ None  | `Password reset successfully`                                                      |    ✅ Implemented    |

---

## Response Data Examples by Endpoint

### `POST /api/v1/auth/login`

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
  "message": "Logged in successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/auth/register`

```json
{
  "status": "success",
  "data": {
    "id": "2",
    "email": "newuser@codespace.dev",
    "name": "New Developer",
    "avatarUrl": null,
    "role": "USER",
    "createdAt": "2026-08-01T13:00:00.000Z"
  },
  "message": "Account created successfully. Please check your email for the verification code.",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/auth/verify-email`

```json
{
  "status": "success",
  "data": { "message": "Email verified successfully" },
  "message": "Email verified successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/auth/refresh`

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "Access token refreshed successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/auth/forgot-password`

```json
{
  "status": "success",
  "data": { "message": "If this email is registered, a reset code has been sent." },
  "message": "If this email is registered, a reset code has been sent",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

### `POST /api/v1/auth/reset-password`

```json
{
  "status": "success",
  "data": { "message": "Password updated successfully" },
  "message": "Password reset successfully",
  "meta": { "timestamp": 1785564382331, "version": "v1" }
}
```

---

## Error Messages & Scenarios

When an error occurs, the global `HttpExceptionFilter` formats errors into:

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

| Scenario                     | Triggering Endpoint         | HTTP Code | Error Code (`code`)         | Error Message (`message`)                             |
| :--------------------------- | :-------------------------- | :-------: | :-------------------------- | :---------------------------------------------------- |
| Invalid Email/Password       | `POST /auth/login`          |   `401`   | `INVALID_CREDENTIALS`       | `Invalid email or password`                           |
| Duplicate Email              | `POST /auth/register`       |   `409`   | `EMAIL_ALREADY_EXISTS`      | `Email already registered`                            |
| Invalid OTP Code             | `POST /auth/verify-email`   |   `401`   | `INVALID_VERIFICATION_CODE` | `Invalid, expired, or already used verification code` |
| Missing Refresh Cookie       | `POST /auth/refresh`        |   `401`   | `MISSING_REFRESH_TOKEN`     | `Refresh token not provided`                          |
| Session Expired / Revoked    | `POST /auth/refresh`        |   `401`   | `INVALID_SESSION`           | `Session expired or invalid`                          |
| Invalid / Expired Reset Code | `POST /auth/reset-password` |   `401`   | `INVALID_VERIFICATION_CODE` | `Invalid or expired reset code`                       |
| Invalid Bearer Token         | `POST /auth/logout`         |   `401`   | `UNAUTHORIZED`              | `Unauthorized`                                        |
