# CodeSpace API (`code-space-api`)

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)

Backend REST API for **CodeSpace**, an Electron-based multi-terminal workspace management desktop application. Powers user authentication, cloud configuration synchronization, workspace preset backups, custom CLI tools, custom notification sounds, and directory history.

---

## Documentation

All core documentation for this repository lives in the [`docs/`](docs/) folder:

- [docs/README.md](docs/README.md) — Index of all API documentation guides.
- [docs/project-overview.md](docs/project-overview.md) — Tech stack, app purpose, repository structure, and key constraints.
- [docs/getting-started.md](docs/getting-started.md) — Local setup, environment configuration, Prisma migrations, seeding, and Docker Compose.
- [docs/architecture.md](docs/architecture.md) — Process boundaries, layered design, security model (Argon2id + dual-token JWT), and error pipeline.
- [docs/db.md](docs/db.md) — Complete Prisma ORM schema (`schema.prisma`) and MySQL 8.0 relational database model.
- [docs/api-guide.md](docs/api-guide.md) — RESTful API routes, request/response contracts, and status codes.
- [docs/sync-guide.md](docs/sync-guide.md) — Offline-first desktop cloud synchronization and Last-Write-Wins conflict resolution strategy.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Run Prisma migrations & seed default CLI tools
npx prisma migrate dev --name init
npm run seed

# 4. Launch development server
npm run dev
```

---

## License

MIT © CodeSpace Team
