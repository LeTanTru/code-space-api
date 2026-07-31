# Project Overview

## What is CodeSpace API?

`code-space-api` is the backend web service for **CodeSpace**, an Electron-based multi-terminal desktop workspace manager. It handles user authentication, cloud synchronization of user preferences and workspace presets, storage of custom CLI tool configurations, custom notification audio files, and directory navigation history.

## Tech Stack

| Component          | Technology               | Version                  | Purpose                                         |
| :----------------- | :----------------------- | :----------------------- | :---------------------------------------------- |
| **Runtime**        | Node.js                  | v20.x LTS                | Server execution environment                    |
| **Language**       | TypeScript               | v5.x                     | Static typing and interfaces                    |
| **Framework**      | Express.js               | v4.x                     | RESTful API HTTP routing                        |
| **Database**       | MySQL                    | v8.0                     | Relational database storage                     |
| **ORM**            | Prisma                   | v6.x                     | Type-safe database queries & migrations         |
| **Authentication** | Argon2id + JWT           | `argon2`, `jsonwebtoken` | Password hashing & dual-token access control    |
| **Validation**     | Zod                      | v3.x                     | Request payload & environment schema validation |
| **Security**       | Helmet, CORS, Rate-Limit | v8.x, v2.x, v7.x         | HTTP security headers & IP rate limiting        |

## Source Map

```
src/
├── app.ts                  # Express application setup & middleware assembly
├── server.ts               # HTTP server bootstrap & process signal handling
├── config/                 # Environment variables schema & Prisma Client instance
│   ├── env.ts
│   └── db.ts
├── controllers/            # Request handlers (parses inputs, calls services)
│   ├── auth.controller.ts
│   ├── settings.controller.ts
│   ├── presets.controller.ts
│   ├── cli.controller.ts
│   ├── sounds.controller.ts
│   ├── history.controller.ts
│   └── sync.controller.ts
├── dtos/                   # Zod schemas & TypeScript DTO interfaces
│   ├── auth.dto.ts
│   ├── settings.dto.ts
│   ├── preset.dto.ts
│   └── sync.dto.ts
├── middlewares/            # Security, Auth, Rate Limiter & Global Error Handlers
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── validate.middleware.ts
├── routes/                 # Express router endpoint definitions
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── settings.routes.ts
│   ├── presets.routes.ts
│   └── sync.routes.ts
├── services/               # Core business logic & database transactions
│   ├── auth.service.ts
│   ├── settings.service.ts
│   ├── preset.service.ts
│   └── sync.service.ts
└── utils/                  # Hashing, token generation, and logging helpers
    ├── argon.util.ts
    ├── jwt.util.ts
    └── logger.util.ts
```

## Key Workflows

1. **User Authentication**: Password validation using Argon2id; returns 15-minute JWT Access Tokens and 7-day HTTP-only Refresh Tokens.
2. **Cloud Settings Sync**: Flushes desktop settings (`userData/db.json`) to MySQL relational tables via transactional upserts.
3. **Workspace Presets Management**: Stores terminal layout trees as JSON objects alongside relational preset metadata.
4. **Custom Audio & CLI Tool Storage**: Manages custom tool commands and Base64-encoded notification audio.

## Core Constraints

- **Scope Isolation**: All data queries must strictly isolate data by `userId`.
- **JSON Serialization**: MySQL `BigInt` columns must be serialized to string in JSON output to prevent JavaScript number precision loss.
- **Transactional Consistency**: Sync operations MUST execute within a single Prisma `$transaction()` block.
