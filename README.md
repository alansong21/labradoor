# Labradoor
A job board for undergrad lab openings @UCLA

Contributors: Kevin Yang, Alan Song, Kevin Yao, Amy Sun, Angela Zhang

# Docker Quickstart

Run the **Next.js (web)** + **Express (server)** app with Docker.

## Prerequisites

* Docker Desktop (or Docker Engine) installed and running.

## 1) Environment variables

Create `server/.env`:

* **Using local Postgres via Compose** (recommended for dev):

  ```dotenv
  DATABASE_URL="postgresql://postgres:postgres@db:5432/appdb?schema=public"
  DIRECT_URL="postgresql://postgres:postgres@db:5432/appdb?schema=public"
  ```

* **Using a remote Postgres / Prisma Accelerate**:

  ```dotenv
  DATABASE_URL="postgresql://<user>:<pass>@<host>:<port>/<db>?schema=public"
  DIRECT_URL="postgresql://<user>:<pass>@<host>:<port>/<db>?schema=public"
  ```

> `DIRECT_URL` is used by Prisma for migrations/introspection; `DATABASE_URL` is used at runtime.

## 2) Start services (dev with hot reload)

From repo root:

```bash
docker compose up --build
```

What starts:

* **web**: Next.js dev server on [http://localhost:3000](http://localhost:3000)
* **server**: Express API on [http://localhost:4000](http://localhost:4000)
* **db**: Postgres on port 5432 (if included in `docker-compose.yml`)

> Code changes in `web/` and `server/` hot-reload thanks to mounted volumes.

## 3) Apply Prisma migrations (first time or after schema changes)

Open a shell into the server container and run migrations:

```bash
docker compose exec server npx prisma migrate dev --name init
```

(Repeat `migrate dev` after editing `server/prisma/schema.prisma`.)

## 4) Verify

* API health: [http://localhost:4000/healthz](http://localhost:4000/healthz)
* Example route: [http://localhost:3000](http://localhost:3000) (Next proxies `/api/*` → server)

## Useful commands

```bash
# Stop and remove containers
docker compose down

# View logs (follow)
docker compose logs -f

# Rebuild everything
docker compose build --no-cache

# Shell inside a container
docker compose exec server sh
docker compose exec web sh
```

## Production (optional)

Build and run optimized servers (no volumes, Next built):

```bash
# Build images defined for prod (example)
docker compose -f docker-compose.prod.yml up --build -d

# Run DB migrations in prod
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
```

## Troubleshooting

* **`Missing script: "dev"`**: Ensure `server/package.json` has `"dev": "nodemon index.js"` (or update compose to `npm start`).
* **`ENOTFOUND server` from Next**: The Express container isn’t running or is unhealthy; fix errors in `server` and retry.
* **Compose warning about `version:`**: Remove the `version:` key from `docker-compose.yml` (Compose v2 ignores it).
* **Mac file changes slow**: Use volume mount option `:cached` (e.g., `- ./server:/app:cached`).
