# CodeSpace API (`code-space-api`)

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

Backend REST API for **CodeSpace**, an Electron-based multi-terminal workspace management desktop application. Powers user authentication, account management, email OTP verification, cloud configuration synchronization, workspace preset backups, custom CLI tools, custom notification sounds, and directory history.

---

## Documentation

All core documentation for this repository lives in the [`docs/`](docs/) folder and root configuration guides:

- [AGENTS.md](AGENTS.md) — Coding rules, security guidelines, response standards, and type conventions for AI assistants.
- [docs/README.md](docs/README.md) — Index of all API documentation guides.
- [docs/auth-api.md](docs/auth-api.md) — Authentication endpoints (`login`, `register`, `verify-email`, `refresh`, `logout`, `forgot-password`, `reset-password`).
- [docs/account-api.md](docs/account-api.md) — Account management endpoints (`GET/PUT profile`, `POST change-password`, `GET/DELETE session`, `DELETE account`).
- [docs/health-api.md](docs/health-api.md) — System and MySQL database health check indicator (`GET health`).
- [docs/rate-limiter.md](docs/rate-limiter.md) — Rate limiting, throttling configuration (`@nestjs/throttler`), and HTTP 429 error handling.
- [docs/project-overview.md](docs/project-overview.md) — Tech stack, app purpose, repository structure, and key constraints.
- [docs/getting-started.md](docs/getting-started.md) — Local setup, environment configuration, Prisma migrations, seeding, and Docker Compose.
- [docs/architecture.md](docs/architecture.md) — Process boundaries, layered design, security model (Argon2id + dual-token JWT), and error pipeline.
- [docs/db.md](docs/db.md) — Complete Prisma ORM schema (`schema.prisma`) and MySQL 8.0 relational database model (ERD).
- [docs/api-guide.md](docs/api-guide.md) — RESTful API routes, request/response contracts, and status codes.
- [docs/sync-guide.md](docs/sync-guide.md) — Offline-first desktop cloud synchronization and Last-Write-Wins conflict resolution strategy.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Run Prisma migrations & seed default data
npx prisma migrate dev --name init
npm run seed

# 4. Launch development server in watch mode
npm run start:dev

# 5. Run test suite
npm test
npm run test:watch
```

---

## Swagger OpenAPI Documentation

Interactive OpenAPI documentation is available when running locally at:
`http://localhost:8080/api/docs`

---

## License

MIT © CodeSpace Team
