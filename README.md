# Carelynk Homecare MVP

Full-stack take-home project implementing a two-portal homecare onboarding and matching platform.

## Quick links

- [Docker setup guide](DOCKER_SETUP.md)
- [Database schema reference](DB_SCHEMA.md)

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
- [`DOCKER_SETUP.md`](DOCKER_SETUP.md) Docker setup and troubleshooting
- [`DB_SCHEMA.md`](DB_SCHEMA.md) database schema reference
- `COPILOT.md` assignment requirements

## Setup requirements

Recommended workflow is Docker-based bootstrap from repo root (see [Docker setup guide](DOCKER_SETUP.md)).

Required tools:

- Docker Desktop (or Docker Engine + Compose v2)
- Node.js 18+
- npm 9+

You do **not** need a separate local PostgreSQL install when using the provided scripts/Compose setup.

## One-command project bootstrap (recommended)

Use the root scripts to prepare and run everything:

- checks required tools (`docker`, `docker compose`, `node`, `npm`)
- checks Docker daemon availability
- creates missing env files (`backend/.env`, `frontend/.env`) without overwriting existing files
- installs backend/frontend dependencies
- recreates and starts the full Docker stack
- optionally imports dummy data from a dump file

### Windows (PowerShell)

```powershell
.\run-project.ps1
```

With explicit dump:

```powershell
.\run-project.ps1 -DumpFile .\seed\dummy.dump
```

Force dump re-import:

```powershell
$env:FORCE_DUMP_IMPORT="1"; .\run-project.ps1
```

### Linux/macOS (Bash)

```bash
chmod +x ./run-project.sh
./run-project.sh
```

With explicit dump:

```bash
./run-project.sh ./seed/dummy.dump
```

Force dump re-import:

```bash
FORCE_DUMP_IMPORT=1 ./run-project.sh
```



## Runtime endpoints

After bootstrap/compose startup:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- postgres: `localhost:5432`

## Seed dummy data

After the stack is running, seed comprehensive demo data:

- Windows:

```powershell
.\seed-dummy-data.ps1
```

- Linux/macOS:

```bash
chmod +x ./seed-dummy-data.sh
./seed-dummy-data.sh
```

You can also run backend seeding directly:

```bash
cd backend
npm run seed:dummy
```

## Demo login credentials

All caregiver demo users use password: `Caregiver123!`
All care seeker demo users use password: `Seeker123!`

### Caregiver accounts

- `caregiver.alex@demo.carelynk`
- `caregiver.blair@demo.carelynk`
- `caregiver.casey@demo.carelynk`
- `caregiver.devon@demo.carelynk`
- `caregiver.elliot@demo.carelynk`

### Care seeker accounts

- `seeker.fiona@demo.carelynk`
- `seeker.gabriel@demo.carelynk`
- `seeker.harper@demo.carelynk`



## Build & test (optional local verification)

### Start database (required for backend verification)

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
npm test -- --watch=false
```


## Core API highlights

Schema details for related tables/columns: [DB_SCHEMA.md](DB_SCHEMA.md).

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
When a caregiver profile is updated, a background rematch is queued and status is exposed on caregiver profile responses.

A caregiver matches only when all are true:

- **Location match:** A match will happen if both the request and seeker are in the same country and state/province. This is a major assumption, and made like this for ease of showing matches. I did mess aroung with using geoencoding services, but I decided they were too much for this project.
- **Availability match:** Care Request time-day slots fall withing Care Giver's Availability times and days.
- **Experience match:** each required experience is found in caregiver skills or experience tags.

Implementation: `backend/src/services/matchingService.ts`.

## Major assumptions

- One account has exactly one role (`caregiver` or `care_seeker`).
- Matching is rule-based; care-request matching is synchronous, while caregiver profile rematch is asynchronous with status visibility.
- Matching happens when the request is submitted, and matches can also be recomputed when the list of matches is requested.
- A care seeker can send an accept request to one caregiver per care request at a time.
- Security is baseline for MVP (JWT auth, validation, helmet, role checks)

## Minor Assumptions
- Each Username is unique


## Sample demo flow

1. Create caregiver account and complete onboarding.
2. Create care seeker account and complete profile.
3. Create a care request with schedule/location/required experiences.
4. Open matches and send an accept request.
5. Log back in as caregiver and review incoming/accepted jobs.




