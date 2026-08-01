# CodeSpace API — Rate Limiting & Throttling Documentation

This document specifies the rate limiting architecture, configuration settings, sensitive endpoint protection, and HTTP 429 response contracts implemented in `code-space-api`.

---

## 1. Overview

`code-space-api` uses **`@nestjs/throttler` (v6.x)** to protect backend REST services against Denial of Service (DDoS) attacks, brute-force password attempts, and OTP guessing.

Rate limiting operates as a global guard (`ThrottlerGuard`) registered via `APP_GUARD` in `AppModule`. It tracks incoming request IP addresses and enforces sliding window request limits.

---

## 2. Configuration & Environment Variables

Rate limiting is fully configurable via environment variables in `.env`:

| Environment Variable | Default Value | Description                                                          |
| :------------------- | :-----------: | :------------------------------------------------------------------- |
| `THROTTLE_TTL`       |    `60000`    | Time-to-live window in milliseconds (default: 60 seconds)            |
| `THROTTLE_LIMIT`     |     `60`      | Maximum request limit per client IP within the `THROTTLE_TTL` window |

### Example `.env` Configuration

```env
# Rate Limiting (Throttler — TTL in ms, limit in requests)
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
```

---

## 3. Global & Per-Endpoint Limits

### Global Default Limit

By default, all endpoints inherit the global rate limit:

- **Limit**: `60 requests` per client IP
- **Window**: `60,000 ms` (1 minute)

### Sensitive Endpoint Protection (`@Throttle`)

To prevent brute-force attacks and email spamming, sensitive authentication endpoints enforce a stricter limit of **10 requests per 60 seconds**:

| Endpoint                       | Method |  Rate Limit  | Purpose                             |
| :----------------------------- | :----: | :----------: | :---------------------------------- |
| `/api/v1/auth/login`           | `POST` | 10 req / 60s | Prevent password brute-forcing      |
| `/api/v1/auth/register`        | `POST` | 10 req / 60s | Prevent account creation spam       |
| `/api/v1/auth/verify-email`    | `POST` | 10 req / 60s | Prevent 6-digit OTP code guessing   |
| `/api/v1/auth/forgot-password` | `POST` | 10 req / 60s | Prevent OTP email dispatch spam     |
| `/api/v1/auth/reset-password`  | `POST` | 10 req / 60s | Prevent password reset OTP guessing |

---

## 4. HTTP 429 Error Response Format

When a client exceeds the permitted request threshold, the server returns an **HTTP 429 Too Many Requests** response formatted by the global `HttpExceptionFilter`:

```json
{
  "status": "error",
  "code": "TOO_MANY_REQUESTS",
  "message": "Too many requests, please try again after 60 seconds",
  "meta": {
    "timestamp": 1785564382331,
    "path": "/api/v1/auth/login"
  }
}
```

---

## 5. Developer Usage & Customization

### Overriding Rate Limits on Custom Endpoints

Use the `@Throttle()` decorator to apply custom limits to specific controller handlers:

```typescript
import { Throttle } from '@nestjs/throttler';

@Post('custom-action')
@Throttle({ default: { limit: 5, ttl: 60000 } })
async customAction() {
  // Handler logic...
}
```

### Skipping Rate Limiting

To bypass rate limiting for specific endpoints (e.g. internal health checks or webhooks), apply `@SkipThrottle()`:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('health')
@SkipThrottle()
async healthCheck() {
  // Health check logic...
}
```
