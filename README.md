# Carelynk Homecare MVP

Full-stack take-home project implementing a two-portal homecare onboarding and matching platform.

## Tech stack

- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL
- Frontend: React + TypeScript

## Implemented assignment scope

- Separate caregiver and care seeker portals with dedicated auth pages
- Role-based signup/login and protected routes
- Caregiver onboarding/profile (name, contact, location, skills, experience, availability, optional qualifications)
- Care seeker profile and care request creation
- Matching of caregivers to requests by location, availability, and experience
- PostgreSQL persistence for users, profiles, care requests, matches, and job acceptance workflow

## Repository structure

- `backend/` Express API, migrations, repositories, matching service
- `frontend/` React app with role-specific portal UX
- `DB_SCHEMA.md` database schema reference
- `COPILOT.md` assignment requirements

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (or compatible)

## Environment setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Update values:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `JWT_SECRET` (minimum 32 chars)
   - optional: `PORT`, `JWT_EXPIRE`, `LOG_LEVEL`

### Frontend

Create `frontend/.env`:

```env
REACT_APP_API_BASE_URL=http://localhost:3000
```

## Run locally

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Start backend

```bash
cd backend
npm run dev
```

Backend runs migrations automatically on startup.

### Start frontend

```bash
cd frontend
npm start
```

## Build & test

### Backend

```bash
cd backend
npm run build
```

Note: `npm run lint` currently fails because the repo uses ESLint v9 with legacy `.eslintrc` format and no `eslint.config.js`.

### Frontend

```bash
cd frontend
npm run build
npm test -- --watch=false
```

## Core API highlights

- Auth:
  - `POST /api/auth/caregiver/signup`
  - `POST /api/auth/care_seeker/signup`
  - `POST /api/auth/login`
- Caregiver:
  - `GET/POST/PUT /api/caregiver/profile`
  - `GET /api/caregiver/job-accept-requests`
  - `GET /api/caregiver/accepted-jobs`
- Care seeker:
  - `GET/POST/PUT /api/seekers/profile`
  - `POST /api/jobs`
  - `GET /api/jobs`
  - `GET /api/jobs/:jobId/matches`
  - `POST /api/jobs/:jobId/accept`

## Matching logic (brief)

Matching executes when a care request is created or updated.

A caregiver matches only when all are true:

- **Location match:** request `service_location_details` and caregiver location data match by normalized region fields
- **Availability match:** structured slots overlap, or fallback text tokens overlap meaningfully
- **Experience match:** each required experience is found in caregiver skills, experience tags, or experience text

Implementation: `backend/src/services/matchingService.ts`.

## Major assumptions

- One account has exactly one role (`caregiver` or `care_seeker`).
- Matching is rule-based and synchronous (no async job queue).
- A care seeker can send an accept request to one caregiver per care request at a time.
- Security is baseline for MVP (JWT auth, validation, helmet, role checks), not production-hardening.

## Sample demo flow

1. Create caregiver account and complete onboarding.
2. Create care seeker account and complete profile.
3. Create a care request with schedule/location/required experiences.
4. Open matches and send an accept request.
5. Log back in as caregiver and review incoming/accepted jobs.

## Run full stack with Docker Compose

This repository now includes a root `docker-compose.yml` that starts:

- `frontend` (React app) on `http://localhost:3000`
- `backend` (Node/TypeScript API) on `http://localhost:3001`
- `postgres` (PostgreSQL) on `localhost:5432`

## One-command project bootstrap

From the repository root, you can run one script to:

- validate required tools (`docker`, `docker compose`, `node`, `npm`)
- verify Docker daemon is running
- create missing `backend/.env` and `frontend/.env` files (without overwriting existing ones)
- install dependencies for backend and frontend
- build and start the full Docker Compose stack
- optionally import dummy data from a dump file into PostgreSQL

### Windows (PowerShell)

```powershell
.\run-project.ps1
```

### Linux/macOS (Bash)

```bash
chmod +x ./run-project.sh
./run-project.sh
```

You can also pass a specific dump file:

```bash
./run-project.sh ./seed/dummy.dump
```

### Optional dump import

The scripts will look for a dump in this order (first match wins):

- `./*.dump` then `./*.sql`
- `./seed/*.dump` then `./seed/*.sql`
- `./data/*.dump` then `./data/*.sql`
- `./db/*.dump` then `./db/*.sql`

Format handling:

- Custom Postgres dump (magic header `PGDMP`) -> imported with `pg_restore`
- Plain SQL dump (`.sql` or text dump) -> imported with `psql`

Safety behavior:

- If `public.users` already has rows, import is skipped by default.
- To force re-import:
  - PowerShell: `$env:FORCE_DUMP_IMPORT="1"; .\run-project.ps1`
  - Bash: `FORCE_DUMP_IMPORT=1 ./run-project.sh`

PowerShell with explicit dump file:

```powershell
.\run-project.ps1 -DumpFile .\seed\dummy.dump
```

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

### Start everything

From the repository root:

```bash
docker compose up --build
```

Important: start services with this root Compose command (not Docker Desktop "Run" on individual images), so backend can resolve the Postgres service hostname over the Compose network.

### Run in background

```bash
docker compose up -d --build
```

### Stop everything

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```
