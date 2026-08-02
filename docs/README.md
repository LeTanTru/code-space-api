# Documentation

This folder documents the core architecture, database models, API contracts, and development workflows for `code-space-api`. The scope is intentionally kept focused so the documentation remains synchronized with the codebase.

## Guides

- [project-overview.md](project-overview.md)  
  Contributor-oriented summary of the API purpose, tech stack, source map (including `src/modules/` structure), workflows, and constraints.

- [architecture.md](architecture.md)  
  Layered architecture, module dependency graph, class diagram, security design (Argon2id + Dual JWT), email CID logo pattern, and error handling pipeline.

- [getting-started.md](getting-started.md)  
  Local setup, environment variables, Prisma database migrations, seeding, Docker workflows, and npm command reference.

- [auth-api.md](auth-api.md)  
  Authentication specifications: `login`, `register`, `verify-email`, `refresh`, `logout`, `forgot-password`, `reset-password` — including request bodies, responses, and error codes.

- [account-api.md](account-api.md)  
  Authenticated user account management: `GET profile`, `PUT update/profile`, `POST change-password`, `DELETE delete`.

- [session-api.md](session-api.md)  
  Device session listing & revocation: `GET session/list`, `DELETE session/delete/:id` — including IDOR protection details and DTO field reference.

- [health-api.md](health-api.md)  
  System health monitoring & MySQL database connection indicator (`GET /health`).

- [workspace-api.md](workspace-api.md)  
  Cloud workspace management: `GET /workspaces`, `POST /workspaces`, `PUT /workspaces/:id`, `DELETE /workspaces/:id`.

- [preset-api.md](preset-api.md)  
  Layout preset synchronization: `GET /presets`, `POST /presets`, `PUT /presets/:id`, `DELETE /presets/:id`.

- [settings-api.md](settings-api.md)  
  Desktop preferences & CLI registry sync: `GET /settings`, `PUT /settings`.

- [sync-api.md](sync-api.md)  
  Offline-first Zustand state snapshot cloud backup: `POST /sync/push`, `GET /sync/pull`.

- [api-guide.md](api-guide.md)  
  Response envelope standards, error code dictionary, and links to all module-specific API docs.

- [rate-limiter.md](rate-limiter.md)  
  Rate limiting & throttling specifications (`@nestjs/throttler`), sensitive route overrides, and HTTP 429 response structure.

- [db.md](db.md)  
  Complete `schema.prisma` specification for MySQL 8.0, entity relationship diagrams, indexes, and relational mappings.

- [sync-guide.md](sync-guide.md)  
  Offline-first cloud synchronization protocol connecting `code-space-desktop` (`db.json`) and `code-space-api` (MySQL), featuring Last-Write-Wins conflict resolution.

## Maintenance Rule

If code changes and a doc here becomes too specific to trust, prefer updating or simplifying the stale section over expanding it.
