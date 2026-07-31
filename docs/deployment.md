# Deployment

## Docker Compose (Recommended Local + Staging)

`docker-compose.yml` defines two services: `app` (the Node.js API) and `postgres` (PostgreSQL 16).

### Start everything

```bash
docker compose up -d
```

### Start only the database (for local dev with `npm run dev`)

```bash
docker compose up postgres -d
```

### Stop and remove containers

```bash
docker compose down
```

### Stop and remove containers + volumes (drops database data)

```bash
docker compose down -v
```

---

## Environment Variables

All runtime config is injected via environment variables. In Docker Compose, these are set in the `environment:` block of `docker-compose.yml`. In production, use your hosting platform's secrets manager.

| Variable                 | Required | Description                                              |
| ------------------------ | -------- | -------------------------------------------------------- |
| `DATABASE_URL`           | Yes      | PostgreSQL connection string                             |
| `JWT_ACCESS_SECRET`      | Yes      | Access token signing secret (min 32 chars)               |
| `JWT_REFRESH_SECRET`     | Yes      | Refresh token signing secret (min 32 chars)              |
| `JWT_ACCESS_EXPIRES_IN`  | Yes      | Access token TTL (e.g. `15m`)                            |
| `JWT_REFRESH_EXPIRES_IN` | Yes      | Refresh token TTL (e.g. `7d`)                            |
| `PORT`                   | Yes      | HTTP server port (e.g. `4000`)                           |
| `NODE_ENV`               | Yes      | `development` or `production`                            |
| `CORS_ORIGIN`            | Yes      | Desktop app origin allowed by CORS (e.g. `http://localhost:5173`) |

> **Security**: Use secrets of at least 32 random characters for JWT secrets. Generate them with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(40).toString('hex'))"
> ```

---

## Dockerfile

The Dockerfile uses a two-stage build:

1. **Build stage** — installs all dependencies, generates the Prisma client, and compiles TypeScript to `dist/`.
2. **Production stage** — copies `dist/`, `prisma/`, and `node_modules` (production-only) into a clean Node.js 22 Alpine image.

### Build and run manually

```bash
# Build image
docker build -t code-space-api .

# Run with env vars
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  -e JWT_ACCESS_EXPIRES_IN="15m" \
  -e JWT_REFRESH_EXPIRES_IN="7d" \
  -e PORT="4000" \
  -e NODE_ENV="production" \
  -e CORS_ORIGIN="https://your-desktop-origin" \
  code-space-api
```

---

## Database Migrations in Production

Run migrations before starting the server in CI/CD:

```bash
npx prisma migrate deploy
```

This applies all pending migrations without prompting. It never resets data.

Do **not** run `prisma migrate dev` in production — it may reset the database.

### Migration strategy for zero-downtime

1. Deploy a migration that is backward-compatible with the old code (additive changes, nullable columns).
2. Deploy the new server version.
3. Clean up the old schema in a follow-up migration once all instances are on the new version.

---

## Health Check

The Docker Compose `app` service and any load balancer should poll:

```
GET http://localhost:4000/api/v1/health
```

Expected healthy response: `200 { success: true, data: { status: "ok" } }`

---

## Production Checklist

- [ ] `NODE_ENV=production` is set
- [ ] JWT secrets are at least 32 random characters
- [ ] `DATABASE_URL` points to the production PostgreSQL instance
- [ ] `CORS_ORIGIN` is set to the exact desktop app origin (not `*`)
- [ ] `prisma migrate deploy` has been run
- [ ] HTTPS is terminated at a reverse proxy (Nginx, Caddy, or cloud LB)
- [ ] The API port (`4000`) is not publicly exposed — only the HTTPS proxy port
- [ ] PostgreSQL is not publicly exposed — only accessible within the Docker network
- [ ] Refresh token secrets are rotated from the defaults in `.env.example`

---

## Reverse Proxy (Nginx Example)

```nginx
server {
    listen 443 ssl;
    server_name api.codespace.example.com;

    ssl_certificate     /etc/ssl/certs/codespace.crt;
    ssl_certificate_key /etc/ssl/private/codespace.key;

    location / {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Related Docs

- [getting-started.md](getting-started.md) — local dev setup
- [database.md](database.md) — schema and migration reference
