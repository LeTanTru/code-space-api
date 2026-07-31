# Documentation

This folder documents the core architecture, database models, API contracts, and development workflows for `code-space-api`. The scope is intentionally kept focused so the documentation remains synchronized with the codebase.

## Guides

- [project-overview.md](project-overview.md)  
  Contributor-oriented summary of the API purpose, tech stack, source map, workflows, and constraints.

- [getting-started.md](getting-started.md)  
  Local setup, environment variables, Prisma database migrations, seeding, and Docker workflows.

- [architecture.md](architecture.md)  
  Layered architecture, security design (Argon2id + Dual JWT Tokens), request lifecycle, and error handling pipeline.

- [db.md](db.md)  
  Complete `schema.prisma` specification for MySQL 8.0, entity relationship diagrams, indexes, and relational mappings.

- [api-guide.md](api-guide.md)  
  Complete RESTful HTTP endpoint contracts, request/response JSON bodies, query params, and status codes.

- [sync-guide.md](sync-guide.md)  
  Offline-first cloud synchronization protocol connecting `code-space-desktop` (`db.json`) and `code-space-api` (MySQL), featuring Last-Write-Wins conflict resolution.

## Maintenance Rule

If code changes and a doc here becomes too specific to trust, prefer deleting or simplifying the stale section over expanding it.
