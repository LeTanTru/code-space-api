# Getting Started

## Local Setup

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MySQL**: `v8.0+` (running locally or via Docker)

### Installation & Environment

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/your-org/code-space-api.git
   cd code-space-api
   npm install
   ```

2. Copy the sample environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your local database credentials:

   ```env
   PORT=8080
   NODE_ENV=development
   DATABASE_URL="mysql://root:rootpassword@localhost:3306/codespace_db?parseTime=true"
   JWT_ACCESS_SECRET="your-super-secret-access-key-32-chars-min"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-min"
   ```

### Database Migration & Seed

Run initial Prisma migrations to setup the MySQL database schema and seed default CLI tools:

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed default built-in CLI tools
npm run seed
```

### Running the Server

```bash
# Development mode (with live reload via tsx)
npm run dev

# Production build and run
npm run build
npm start
```

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

| Command                   | Action                                                  |
| :------------------------ | :------------------------------------------------------ |
| `npm run dev`             | Start development server with live reload (`tsx watch`) |
| `npm run build`           | Compile TypeScript source into `dist/`                  |
| `npm start`               | Execute production build (`node dist/server.js`)        |
| `npm run prisma:generate` | Regenerate Prisma Client types                          |
| `npm run prisma:migrate`  | Apply dev database migrations                           |
| `npm run prisma:studio`   | Open interactive Prisma Studio GUI                      |
| `npm run seed`            | Seed database with initial CLI tools                    |
| `npm run test`            | Run Vitest suite                                        |
