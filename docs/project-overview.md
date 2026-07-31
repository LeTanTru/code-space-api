# Project Overview

## Purpose

`code-space-api` is the cloud backend for **CodeSpace Desktop**. It extends the local-first Electron app into a multi-device, cloud-synchronized platform by providing:

- **Secure authentication** — registration, login, JWT access tokens, HttpOnly refresh tokens with rotation.
- **Settings synchronization** — push and pull all 14 CodeSpace DB keys across devices, with Last-Write-Wins conflict resolution.
- **Workspace preset cloud backup** — store, restore, and share workspace preset profiles.
- **Remote user settings** — appearance, terminal, notification, and CLI preferences per account.

The desktop app remains fully functional offline. API connectivity is additive: when a user is authenticated and online, local state changes are automatically pushed to the server and pulled on other devices.

---

## Tech Stack

| Layer                  | Technology                                   |
| ---------------------- | -------------------------------------------- |
| **Runtime**            | Node.js 22 LTS                               |
| **Language**           | TypeScript 5.x (strict)                      |
| **Framework**          | Express.js 5+                                |
| **Component pattern**  | Servercn (modules copied into `src/`)        |
| **Database**           | PostgreSQL 16+                               |
| **ORM**                | Prisma 5+                                    |
| **Authentication**     | Argon2id + jsonwebtoken                      |
| **Validation**         | Zod                                          |
| **Security**           | Helmet, cors, express-rate-limit             |
| **Logging**            | Structured console logger (pino-style)       |

---

## Source Map

```
prisma/
  schema.prisma           Data model: User, Settings, Presets, Tokens, History
  migrations/             Auto-generated migration files

src/
  app.ts                  Express app factory (middleware + routes)
  server.ts               HTTP server lifecycle + graceful shutdown

  config/
    env.ts                Zod-validated env var parsing
    database.ts           Prisma client singleton

  constants/
    error-codes.ts        Standardized API error code strings
    security.ts           Token lifetimes, cookie flags, rate limit config

  utils/                  Servercn-pattern modules (100% owned, no CLI runtime)
    api-error.util.ts     ApiError class with static factory methods
    async-handler.util.ts asyncHandler wrapper for Express controllers
    response.util.ts      ApiResponse static class (success, created, noContent)
    hash.util.ts          Argon2id hashPassword / verifyPassword
    jwt.util.ts           signAccessToken / signRefreshToken / verify*
    logger.util.ts        Structured logger
    shutdown.util.ts      Graceful SIGTERM/SIGINT handler

  middlewares/
    auth.middleware.ts    authenticateJwt — Bearer token verification
    error.middleware.ts   globalErrorHandler — maps ApiError to JSON
    rate-limiter.ts       IP + route rate limiter
    validate.middleware.ts validateRequest(schema) — Zod body validation

  types/
    express.d.ts          Express Request augmentation (user payload)
    sync.type.ts          DbState interface (all 14 DB keys)

  schemas/
    auth.schema.ts        Zod schemas for register + login
    preset.schema.ts      Zod schema for preset create/update
    settings.schema.ts    Zod schema for settings update

  repositories/
    user.repository.ts    Prisma CRUD for User + RefreshToken
    preset.repository.ts  Prisma CRUD for WorkspacePreset + PresetTerminal
    settings.repository.ts Prisma CRUD for UserSettings, CustomSound, CliTool,
                            CliBuiltinOverride, DirectoryHistory

  services/
    auth.service.ts       registerUser, loginUser, refreshTokens, logoutUser, getMe
    sync.service.ts       pullCloudState, pushLocalState (LWW merge)
    preset.service.ts     Preset CRUD business logic
    user.service.ts       getUserById, updateUserSettings

  controllers/
    auth.controller.ts    register, login, refresh, logout, me
    sync.controller.ts    pullState, pushState
    preset.controller.ts  listPresets, createPreset, updatePreset, deletePreset
    settings.controller.ts getSettings, updateSettings

  routes/
    index.ts              Central /api/v1 router
    auth.routes.ts        /auth endpoints
    health.routes.ts      GET /health
    sync.routes.ts        /sync/pull + /sync/push (auth-gated)
    preset.routes.ts      /presets CRUD (auth-gated)
    settings.routes.ts    /settings (auth-gated)
```

---

## Layer Responsibilities

### Config
Parses and validates environment variables with Zod at startup. If any required variable is missing or malformed, the process exits immediately with a clear error before any server is bound.

### Utils (Servercn modules)
Self-contained TypeScript files with no shared state. Each implements a single cross-cutting concern (error representation, hashing, token signing). They have no knowledge of Express routes or Prisma models.

### Middlewares
Stateless Express middleware. `auth.middleware.ts` reads the Bearer token and attaches `req.user`. `validate.middleware.ts` parses `req.body` with a Zod schema and forwards a `400` with structured field errors on failure.

### Repositories
Thin data-access layer over Prisma. Each repository function maps directly to one or more Prisma operations with no business logic.

### Services
Business logic layer. Services call repositories and utils. They do not import Express types.

### Controllers
Thin Express request handlers. They call services, then call `ApiResponse` helpers to format the response. All async controllers are wrapped with `asyncHandler` so rejections reach `globalErrorHandler` automatically.

### Routes
Mount controllers on paths, apply middleware chains. The central `src/routes/index.ts` prefixes all routes with `/api/v1`.

---

## Related Docs

- [getting-started.md](getting-started.md)
- [architecture.md](architecture.md)
- [api-reference.md](api-reference.md)
- [database.md](database.md)
- [authentication.md](authentication.md)
- [sync.md](sync.md)
