# AGENTS.md — Guidelines for AI Coding Assistants

This file contains guidelines, coding standards, and architectural rules for AI agents working on `code-space-api`.

---

## 1. Project Overview

`code-space-api` is a **NestJS** backend REST API for the CodeSpace multi-terminal desktop workspace manager. It connects to **MySQL 8.0** via **Prisma ORM** (v6.x) and provides authentication, account management, email verification via Nodemailer SMTP, structured Pino logging, and system health checks.

---

## 2. Core Coding Guidelines & Rules

### Configuration & Environment Variables

- Always access non-optional environment variables using `configService.getOrThrow<string>('VAR_NAME')` instead of optional accessors or `process.env` directly in services.

### Time Constants

- Always import time duration constants (e.g., `ONE_DAY_IN_MS`, `OTP_TTL_MS`, `DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS`) from `src/constants/time.ts`. Never hardcode raw millisecond or second values in service logic.

### Type Definitions

- **Always use `type` instead of `interface`** for type declarations across the entire codebase (`type ClientInfo = { ... }`).

### Security & Authentication Standards

- **Password Hashing**: Always use `argon2id` with explicit parameters (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`).
- **Refresh Tokens**: Store hashed refresh tokens in the database (`tokenHash` via SHA-256) and transmit raw tokens exclusively via HTTP-only cookies (`path: '/api/v1/auth'`).
- **Timing Attacks**: Use `crypto.timingSafeEqual` with fixed-length buffer comparison for validating OTP codes.
- **IDOR Protection**: Always scope resource queries, updates, and deletions by `userId` derived from the validated JWT payload (`req.user.id`).

### API Response Standardization

- Every controller endpoint handler MUST specify a descriptive, standardized success message using the `@ResponseMessage('...')` decorator.
- Response messages follow standard verb conventions:
  - `Get account profile successfully`
  - `Get list of active sessions successfully`
  - `Update account profile successfully`
  - `Change password successfully`
  - `Delete session successfully`
  - `Delete account successfully`
- The global `ResponseInterceptor` wraps all successful responses into the standardized envelope:
  ```json
  {
    "status": "success",
    "data": { ... },
    "message": "<custom_endpoint_message>",
    "meta": { "timestamp": 1785564382331, "version": "v1" }
  }
  ```

### Git Policy

- **Do not add, commit, or push** changes unless explicitly requested by the user.

---

## 3. Module Structure

- **`src/auth/`**: Authentication endpoints (`login`, `register`, `verify-email`, `refresh`, `logout`, `forgot-password`, `reset-password`), JWT strategies, and guards.
- **`src/account/`**: Authenticated account management (`profile`, `change-password`, `session`, `session/delete/:id`, `delete`).
- **`src/mail/`**: Nodemailer SMTP service for email OTP delivery (falls back to console logging if `SMTP_HOST` is unset).
- **`src/health/`**: Terminus system health check & MySQL connection indicator (`GET /health`).
- **`src/common/`**: Global exception filters, response interceptors, custom decorators, and shared DTOs.
- **`src/prisma/`**: PrismaService wrapper and module.

---

## 4. Verification Commands

Run these commands to verify changes before marking tasks complete:

```bash
# Compile TypeScript & NestJS build
npm run build

# Run unit test suite
npm test

# Format code with Prettier
yarn format
```
