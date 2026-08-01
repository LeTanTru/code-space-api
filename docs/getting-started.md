# Getting Started

## Local Setup

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MySQL**: `v8.0+` (running locally or via Docker)

### Installation & Environment

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/LeTanTru/code-space-api.git
   cd code-space-api
   npm install
   ```

2. Copy the sample environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your local configuration:

   ```env
   PORT=8080
   NODE_ENV=development

   # Database
   DATABASE_URL="mysql://root:rootpassword@localhost:3306/codespace_db"

   # JWT Secrets (min 32 chars)
   JWT_ACCESS_SECRET="your-super-secret-access-key-32-chars-min"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-min"
   JWT_ACCESS_EXPIRES_IN="15m"
   JWT_REFRESH_EXPIRES_IN="7d"

   # SMTP Email (optional — emails are logged to console if not set)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM="CodeSpace <no-reply@codespace.dev>"

   # Rate Limiting
   THROTTLE_TTL=60000
   THROTTLE_LIMIT=60
   ```

### Database Migration & Seed

Run initial Prisma migrations to set up the MySQL database schema:

```bash
# Apply migrations and generate Prisma Client
npx prisma migrate dev --name init

# Seed default data
npm run seed
```

### Running the Server

```bash
# Development mode (with live reload via ts-jest / NestJS watch)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

The API will be available at `http://localhost:8080/api/v1`.  
Interactive Swagger documentation is available at `http://localhost:8080/api/docs`.

---

## Docker Workflows

To run MySQL 8.0 and the API service inside Docker containers:

```bash
# Launch containers in background
docker-compose up -d --build

# View container logs
docker-compose logs -f api

# Tear down containers and volumes
docker-compose down -v
```

---

## npm Commands Reference

| Command                  | Action                                    |
| :----------------------- | :---------------------------------------- |
| `npm run start:dev`      | Start development server with live reload |
| `npm run build`          | Compile TypeScript source into `dist/`    |
| `npm run start:prod`     | Execute production build from `dist/`     |
| `npm test`               | Run Jest test suite                       |
| `npm run format`         | Format all source files with Prettier     |
| `npm run lint`           | Lint all source files with ESLint         |
| `npx prisma migrate dev` | Apply dev database migrations             |
| `npx prisma generate`    | Regenerate Prisma Client types            |
| `npx prisma studio`      | Open interactive Prisma Studio GUI        |
| `npm run seed`           | Seed database with initial data           |
