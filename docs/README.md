# Documentation

This folder documents the `code-space-api` Node.js backend. Keep it tight — prefer deleting stale sections over accumulating outdated detail.

## Guides

- [project-overview.md](project-overview.md)  
  Purpose, tech stack, source map, and layer responsibilities.

- [getting-started.md](getting-started.md)  
  Local setup, environment variables, database seeding, and dev commands.

- [architecture.md](architecture.md)  
  Layer model, request lifecycle, and core file roles.

- [api-reference.md](api-reference.md)  
  Complete endpoint specification with request/response shapes for all routes.

- [authentication.md](authentication.md)  
  JWT flow, refresh token rotation, Argon2id hashing, and cookie strategy.

- [database.md](database.md)  
  Prisma schema, model relationships, field defaults, and migration workflow.

- [sync.md](sync.md)  
  Cloud sync protocol, 14-key snapshot format, and Last-Write-Wins conflict resolution.

- [servercn-components.md](servercn-components.md)  
  Inventory of all Servercn-pattern modules copied into `src/`, their source spec, and usage guide.

- [deployment.md](deployment.md)  
  Docker Compose setup, Dockerfile, environment configuration, and production checklist.

## Maintenance Rule

If code changes and a doc here becomes too specific to trust, prefer deleting or simplifying the stale section over expanding it.
