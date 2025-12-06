# Labradoor
A job board for undergrad lab openings @UCLA

Contributors: Kevin Yang, Alan Song, Kevin Yao, Amy Sun, Angela Zhang

# Diagrams

## Database Schema

![Database schema](docs/ERD.png)

Prisma database entity relationship diagram.

## Researcher posting creation sequence

![Post creation sequence](docs/Sequence.png)

Complete flow when a researcher creates a new post with questions.

# Production

Production code is currently on www.labradoor.app
It is currently not tested, please run repository locally for a fully working version

# Docker Quickstart

Run the **Next.js (web)** + **Express (server)** app with Docker.

## Prerequisites

* Docker Desktop (or Docker Engine) installed and running.

## 1) Environment variables

Paste the following into `server/.env` (adjust values as needed):

```dotenv
# Prisma / database
DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/appdb?schema=public"
DIRECT_URL="postgresql://postgres:postgres@host.docker.internal:5432/appdb?schema=public"

# Optional: isolated DB for tests/e2e
DATABASE_URL_TEST="postgresql://postgres:postgres@host.docker.internal:5432/appdb_test?schema=public"
DIRECT_URL_TEST="postgresql://postgres:postgres@host.docker.internal:5432/appdb_test?schema=public"

# App / service toggles
SEND_VERIFICATION_EMAIL="false"
ENABLE_DEV_TOOLS="true"
APP_BASE_URL="http://localhost:3000"

# Third-party keys (examples)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
DOMAIN="labradoor.local"
PORKBUN_PSW="changeme"
```

Paste the following into `web/.env.local` so the Next.js app knows how to reach the API:

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

> The provided `docker-compose.yml` only launches the web and API containers. Start Postgres separately (local container, managed service, Prisma Accelerate, etc.) and update the URLs above to match it. Commit your real secrets to a safe store—these examples are placeholders.

## 2) Start services (dev with hot reload)

From repo root:

```bash
docker compose up --build
```

What starts:

* **web**: Next.js dev server on [http://localhost:3000](http://localhost:3000)
* **server**: Express API on [http://localhost:4000](http://localhost:4000)

> Code changes in `web/` and `server/` hot-reload thanks to mounted volumes. Postgres is **not** bundled in this compose file—start it separately before bringing the stack up.

## 3) Apply Prisma migrations (first time or after schema changes)

Ensure your Postgres instance is reachable, then run migrations from inside the server container:

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

## Production / deployment

There is no dedicated `docker-compose.prod.yml` checked in. To create a production image, clone or adapt `Dockerfile.web` / `Dockerfile.server`, build them manually, and deploy alongside a managed Postgres database. If you need a compose file for prod, create one in your fork so it matches your hosting environment.

## Testing
For Jest Testing:
```bash
npm test
```

For Cucumber Testing: 
```bash
cd tests
npm run tests
```

For Artillery Stress Testing:
```bash
cd tests
npx artillery run stress/artillery.yml
```

## Troubleshooting

* **`Missing script: "dev"`**: Ensure `server/package.json` has `"dev": "nodemon index.js"` (or update compose to `npm start`).
* **`ENOTFOUND server` from Next**: The Express container isn’t running or is unhealthy; fix errors in `server` and retry.
* **Compose warning about `version:`**: Remove the `version:` key from `docker-compose.yml` (Compose v2 ignores it).
* **Mac file changes slow**: Use volume mount option `:cached` (e.g., `- ./server:/app:cached`).
