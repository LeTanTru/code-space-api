# Servercn Components

## What Is Servercn?

[Servercn](https://servercn.vercel.app) is a backend component registry inspired by `shadcn/ui`. Instead of installing a runtime library, you copy audited, self-contained TypeScript modules directly into your `src/` directory and own them completely. There is no `servercn` package in `node_modules`.

This project follows the Servercn pattern for all cross-cutting infrastructure concerns. Each module below was specified by the Servercn registry and then written into `src/` as plain TypeScript with 100% code ownership.

---

## Component Inventory

### `api-error-handler` → `src/utils/api-error.util.ts`

Provides the `ApiError` class used throughout the codebase to represent expected HTTP errors.

**Usage**

```typescript
import { ApiError } from '../utils/api-error.util';

// In a service or controller:
throw ApiError.unauthorized();           // 401
throw ApiError.notFound('User not found'); // 404
throw ApiError.badRequest('Validation failed', issues); // 400 with errors[]
throw ApiError.forbidden();              // 403
throw ApiError.internal();               // 500
```

**Factory methods**

| Method                         | Status |
| ------------------------------ | ------ |
| `ApiError.badRequest(msg, errors?)` | 400 |
| `ApiError.unauthorized(msg?)`  | 401    |
| `ApiError.forbidden(msg?)`     | 403    |
| `ApiError.notFound(msg?)`      | 404    |
| `ApiError.internal(msg?)`      | 500    |

All `ApiError` instances carry `statusCode`, `message`, optional `errors[]`, and `isOperational`. Non-operational errors (programmatic bugs) produce `500` without exposing the message in production.

---

### `response-formatter` → `src/utils/response.util.ts`

Provides the `ApiResponse` static class for standardized JSON envelopes.

**Usage**

```typescript
import { ApiResponse } from '../utils/response.util';

ApiResponse.success({ res, data: user });
ApiResponse.success({ res, statusCode: 200, message: 'Done', data: result });
ApiResponse.created({ res, message: 'Created', data: newRecord });
ApiResponse.noContent(res);
```

All responses follow the shape:

```json
{ "success": true, "message": "...", "data": { ... } }
```

---

### `async-handler` → `src/utils/async-handler.util.ts`

Wraps async Express controller functions so `Promise` rejections are forwarded to the `globalErrorHandler` instead of causing unhandled rejections.

**Usage**

```typescript
import { asyncHandler } from '../utils/async-handler.util';

router.get('/me', authenticateJwt, asyncHandler(me));
```

Without `asyncHandler`, a thrown `ApiError` inside an `async` function would crash the process (Express 4) or silently swallow the error. Express 5 handles this natively, but `asyncHandler` is retained for explicit clarity.

---

### `global-error-handler` → `src/middlewares/error.middleware.ts`

Four-argument Express error middleware that catches all errors forwarded via `next(err)` and serializes them to the standard JSON error envelope.

**Behavior**

- `ApiError` instances use their own `statusCode` and `message`.
- Unknown errors produce `500 Internal Server Error`.
- In `NODE_ENV=development`, the `stack` trace is included in the response.
- In production, `stack` is omitted.

Registered last in `src/app.ts`:

```typescript
app.use(globalErrorHandler);
```

---

### `request-validator` → `src/middlewares/validate.middleware.ts`

Middleware factory that validates `req.body` against a Zod schema before the controller runs.

**Usage**

```typescript
import { validateRequest } from '../middlewares/validate.middleware';
import { registerSchema } from '../schemas/auth.schema';

router.post('/register', validateRequest(registerSchema), asyncHandler(register));
```

On validation failure, forwards `ApiError.badRequest('Validation failed', issues)` where `issues` is an array of `{ field, message }` objects.

---

### `password-hashing` → `src/utils/hash.util.ts`

Argon2id password hashing and verification.

**Usage**

```typescript
import { hashPassword, verifyPassword } from '../utils/hash.util';

const hash = await hashPassword('user-plain-text');
const isValid = await verifyPassword(storedHash, 'user-plain-text');
```

Parameters: `memoryCost: 2^16` (64 MB), `timeCost: 3`, `parallelism: 1`. See [authentication.md](authentication.md) for rationale.

---

### `jwt-utils` → `src/utils/jwt.util.ts`

JWT sign and verify utilities for access and refresh tokens.

**Usage**

```typescript
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util';

const accessToken = signAccessToken({ userId, email });
const refreshToken = signRefreshToken({ userId, email });

const payload = verifyAccessToken(token);  // throws on invalid/expired
```

Reads `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` from the validated env config.

---

### `verify-auth-middleware` → `src/middlewares/auth.middleware.ts`

Express middleware that authenticates requests via `Authorization: Bearer` header.

**Usage**

```typescript
import { authenticateJwt } from '../middlewares/auth.middleware';

router.get('/protected', authenticateJwt, asyncHandler(handler));
```

On success: `req.user = { userId, email }`.
On failure: throws `ApiError.unauthorized(...)`.

The `AuthenticatedRequest` interface extends `Request` with `user?`. Import it in controllers that need `req.user`:

```typescript
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const pullState = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  ...
});
```

---

### `rate-limiter` → `src/middlewares/rate-limiter.ts`

IP-based rate limiting using `express-rate-limit`.

**Usage**

Applied globally in `src/app.ts`:

```typescript
import { globalRateLimiter } from '../middlewares/rate-limiter';
app.use(globalRateLimiter);
```

Default config (from `src/constants/security.ts`):

| Setting          | Value             |
| ---------------- | ----------------- |
| Window           | 15 minutes        |
| Max requests     | 100 per window    |
| Response status  | 429               |

Auth-specific routes (register, login) apply a stricter limiter to prevent brute-force attacks.

---

### `security-header` → applied via `helmet` in `src/app.ts`

HTTP security headers are applied via the `helmet` middleware package, which sets:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Strict-Transport-Security` (in production)

No separate file needed — configured inline in `src/app.ts`.

---

### `logger` → `src/utils/logger.util.ts`

Structured console logger. Used for server startup messages, request logging (via morgan), and service-level events.

**Usage**

```typescript
import { logger } from '../utils/logger.util';

logger.info('Server started on port 4000');
logger.warn('Refresh token not found in DB — possible replay');
logger.error('Database connection failed', error);
```

---

### `shutdown-handler` → `src/utils/shutdown.util.ts`

Registers `SIGTERM` and `SIGINT` handlers to gracefully close the HTTP server and disconnect Prisma before the process exits.

Called in `src/server.ts`:

```typescript
import { registerShutdownHandler } from '../utils/shutdown.util';

const server = http.createServer(app);
registerShutdownHandler(server);
```

---

### `health-check` → `src/routes/health.routes.ts`

`GET /api/v1/health` returns `{ status: "ok", uptime, timestamp }`. No authentication required. Used by Docker health checks, uptime monitors, and load balancers.

---

## Modification Rules

These modules are local files. Modify them freely for project requirements. Do not re-run the Servercn CLI — that would overwrite local changes.

When modifying a component:
- Keep the same exported function/class names to avoid import churn.
- Update this document if the interface changes significantly.
