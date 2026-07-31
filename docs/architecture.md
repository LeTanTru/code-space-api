# Architecture

## Layer Model

The server follows a strict, unidirectional dependency chain:

```
HTTP Request
     │
     ▼
[ Routes ]         — mount controllers on paths, apply middleware chains
     │
     ▼
[ Middlewares ]    — auth, rate-limit, validation, error handling
     │
     ▼
[ Controllers ]    — parse req, call service, format response via ApiResponse
     │
     ▼
[ Services ]       — business logic, orchestrate repositories and utils
     │
     ▼
[ Repositories ]   — Prisma data access, one concern per file
     │
     ▼
[ Prisma / PostgreSQL ]
```

No layer imports from a layer above it. Services never import Express types. Repositories never import service logic.

---

## Entry Points

### `src/server.ts`

Imports the Express `app` from `src/app.ts`, creates an `http.Server`, binds to `PORT`, and registers the graceful shutdown handler from `src/utils/shutdown.util.ts`. This is the process entry point.

### `src/app.ts`

Express application factory. Returns a fully configured `Express` instance with:

1. Security headers (`helmet`)
2. CORS policy (`cors` with `CORS_ORIGIN` env var)
3. Global rate limiter
4. Cookie parser
5. JSON body parser
6. All routes mounted under `/api/v1`
7. `globalErrorHandler` registered last

---

## Request Lifecycle

1. Request arrives at Express.
2. Global middleware chain runs (Helmet → CORS → rate-limiter → body-parser).
3. Router matches the path and method, applies route-level middleware (e.g. `authenticateJwt`, `validateRequest`).
4. Controller function runs inside `asyncHandler`. It calls a service function.
5. Service calls one or more repository functions and/or util functions.
6. Controller calls `ApiResponse.success(...)` or similar to send the response.
7. If any step throws an `ApiError` or unknown error, `asyncHandler` forwards it to `globalErrorHandler`, which serializes it to JSON.

---

## Core Files

| File                                | Role                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| `src/server.ts`                     | HTTP server lifecycle, graceful shutdown                        |
| `src/app.ts`                        | Express app factory, middleware registration, route mounting    |
| `src/config/env.ts`                 | Zod env validation — process exits if any var is invalid        |
| `src/config/database.ts`            | Prisma client singleton                                         |
| `src/utils/api-error.util.ts`       | `ApiError` — typed error with statusCode and optional errors[]  |
| `src/utils/async-handler.util.ts`   | `asyncHandler` — prevents unhandled promise rejections          |
| `src/utils/response.util.ts`        | `ApiResponse` — standardized JSON envelope                      |
| `src/utils/hash.util.ts`            | Argon2id password hashing                                       |
| `src/utils/jwt.util.ts`             | JWT sign and verify for access + refresh tokens                 |
| `src/utils/logger.util.ts`          | Structured logger (request logging, service events)             |
| `src/utils/shutdown.util.ts`        | SIGTERM/SIGINT handler with Prisma disconnect                   |
| `src/middlewares/auth.middleware.ts`| Reads `Authorization: Bearer`, verifies token, attaches user    |
| `src/middlewares/error.middleware.ts`| Maps `ApiError` / unknown errors to JSON                       |
| `src/middlewares/validate.middleware.ts`| Zod schema validation for request body                     |
| `src/middlewares/rate-limiter.ts`   | IP-based rate limiting                                          |
| `src/routes/index.ts`              | Central `/api/v1` router                                        |

---

## Error Handling

All errors flow through a single path:

```
throw ApiError.unauthorized(...)
        │
        ▼
asyncHandler catches the rejection
        │
        ▼
globalErrorHandler serializes to JSON:
{
  "success": false,
  "message": "...",
  "errors": [...],        // optional field-level errors (Zod failures)
  "stack": "..."          // development only
}
```

Operational errors (`isOperational: true`) are expected and mapped to their `statusCode`. Non-operational errors fall back to `500 Internal Server Error`.

---

## Authentication Flow

See [authentication.md](authentication.md) for the full sequence. In brief:

- `POST /api/v1/auth/login` returns a short-lived access token in the response body and a long-lived refresh token in an HttpOnly cookie.
- Protected routes require `Authorization: Bearer <access_token>`.
- `authenticateJwt` middleware verifies the token and attaches `{ userId, email }` to `req.user`.
- `POST /api/v1/auth/refresh` exchanges the cookie refresh token for a new access token and rotates the refresh token (token family pattern).

---

## Sync Architecture

See [sync.md](sync.md) for the full protocol. In brief:

- `GET /api/v1/sync/pull` — assembles all 14 CodeSpace DB keys from relational tables into a single JSON snapshot.
- `POST /api/v1/sync/push` — decomposes incoming DB key delta into individual Prisma upserts. Last-Write-Wins is enforced at the service layer using `updatedAt` timestamps.

---

## Documentation Boundary

This file stays intentionally high level. Exact request/response shapes belong in:

- [api-reference.md](api-reference.md)
- [authentication.md](authentication.md)
- [sync.md](sync.md)
- [database.md](database.md)
