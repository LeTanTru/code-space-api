# Getting Started

## Prerequisites

- Node.js 22 LTS or newer
- npm
- PostgreSQL 16+ (local install or Docker)

Docker is the recommended way to run Postgres locally — see [deployment.md](deployment.md) for the Compose setup.

---

## Clone and Install

```bash
cd code-space-api
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

### Required Variables

| Variable                  | Description                                          | Example                                         |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string (Prisma format)         | `postgresql://user:pass@localhost:5432/csapi_db` |
| `JWT_ACCESS_SECRET`       | Secret for signing access tokens (≥32 chars)        | `super-secret-access-key-32-chars-min`           |
| `JWT_REFRESH_SECRET`      | Secret for signing refresh tokens (≥32 chars)       | `super-secret-refresh-key-32-chars-min`          |
| `JWT_ACCESS_EXPIRES_IN`   | Access token TTL                                     | `15m`                                            |
| `JWT_REFRESH_EXPIRES_IN`  | Refresh token TTL                                    | `7d`                                             |
| `PORT`                    | HTTP server port                                     | `4000`                                           |
| `NODE_ENV`                | Runtime environment                                  | `development`                                    |
| `CORS_ORIGIN`             | Allowed origin for CORS (desktop app origin)         | `http://localhost:5173`                          |

> **Never commit `.env` to source control.** `.env` is listed in `.gitignore`.

---

## Database Setup

### 1. Start PostgreSQL

Using Docker Compose:

```bash
docker compose up postgres -d
```

Or use an existing local Postgres instance. Update `DATABASE_URL` accordingly.

### 2. Run Migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables defined in `prisma/schema.prisma`.

### 3. Generate Prisma Client

The `postinstall` script does this automatically on `npm install`. If needed manually:

```bash
npx prisma generate
```

---

## Run the Dev Server

```bash
npm run dev
```

This starts `tsx watch src/server.ts` — hot-reloads TypeScript without a separate compile step.

The server starts on `http://localhost:4000` by default.

---

## Commands

| Command                      | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `npm run dev`                | Start dev server with hot reload (`tsx watch`)       |
| `npm run build`              | Compile TypeScript to `dist/`                        |
| `npm start`                  | Run compiled output from `dist/server.js`            |
| `npm run type-check`         | Run `tsc --noEmit` type check                        |
| `npm run format`             | Format with Prettier                                 |
| `npm run format:check`       | Validate Prettier formatting                         |
| `npx prisma migrate dev`     | Create and apply a new migration                     |
| `npx prisma migrate deploy`  | Apply pending migrations in production               |
| `npx prisma generate`        | Regenerate Prisma client after schema changes        |
| `npx prisma studio`          | Open Prisma GUI to browse database records           |

---

## Verify the Server is Running

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "ok",
    "uptime": 3.14,
    "timestamp": "2026-07-31T07:00:00.000Z"
  }
}
```

---

## Common Problems

### `DATABASE_URL` connection refused

- Confirm PostgreSQL is running: `docker compose ps` or check your local Postgres service.
- Confirm the port in `DATABASE_URL` matches the running instance (default `5432`).

### Prisma client not found after `npm install`

Run `npx prisma generate` manually. The postinstall hook may have been skipped (e.g. `npm install --ignore-scripts`).

### `Invalid JWT secret` on startup

The Zod env parser rejects secrets shorter than 32 characters. Use longer values in `.env`.

### Type errors in `src/` after schema change

Run `npx prisma generate` to regenerate the Prisma client types, then `npm run type-check`.
