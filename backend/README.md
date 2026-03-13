# Carelynk Backend API

Backend service for the Carelynk homecare matching MVP.
This API handles authentication, caregiver/seeker profiles, care request lifecycle, rule-based matching, and job acceptance workflow.

## Tech stack

- Runtime: Node.js + TypeScript
- HTTP framework: Express
- Database: PostgreSQL (`postgres` client)
- Auth: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Validation: Zod + route-level validation
- Logging: Winston
- Security middleware: `helmet`, `cors`

## High-level architecture

The backend follows a layered structure:

- `routes/` handles HTTP contracts and request validation
- `services/` contains domain logic (for example matching)
- `db/repositories/` contains SQL/data-access operations
- `middleware/` centralizes auth and error handling
- `types/` defines shared TypeScript contracts

Startup flow (`src/index.ts`):

1. Validate env config (`src/config/env.ts`)
2. Initialize DB connection (`src/db/connection.ts`)
3. Run SQL migrations (`src/db/migrate.ts`)
4. Start Express app (`src/app.ts`)

## Project structure

```text
backend/
├─ src/
│  ├─ app.ts                         # Express app setup, middleware, health/version routes
│  ├─ index.ts                       # Service entrypoint + startup orchestration
│  ├─ config/
│  │  ├─ env.ts                      # Environment parsing/validation (Zod)
│  │  └─ logger.ts                   # Winston logger config
│  ├─ middleware/
│  │  ├─ auth.ts                     # JWT parsing + role checks
│  │  └─ errorHandler.ts             # Unified error response shape
│  ├─ routes/
│  │  ├─ index.ts                    # Route registration + auth middleware boundary
│  │  ├─ auth/index.ts               # Signup/login (public)
│  │  ├─ caregivers/profile.ts       # Caregiver profile CRUD-like upsert/get
│  │  ├─ seekers/profile.ts          # Seeker profile upsert/get
│  │  ├─ seekers/jobs.ts             # Job create/list/get/update/delete for seekers
│  │  ├─ jobs/matches.ts             # Seeker view of caregiver matches
│  │  ├─ jobs/acceptRequests.ts      # Seeker accept + caregiver inbox/accept
│  │  └─ experiences.ts              # Shared experience option list/create
│  ├─ services/
│  │  ├─ authService.ts              # Token + password helpers
│  │  └─ matchingService.ts          # Rule-based matching engine
│  ├─ db/
│  │  ├─ connection.ts               # Postgres connection lifecycle
│  │  ├─ migrate.ts                  # SQL migration runner
│  │  ├─ migrations/*.sql            # Incremental schema evolution
│  │  └─ repositories/*.ts           # Data access per aggregate/table
│  ├─ types/index.ts                 # Domain/API shared interfaces
│  └─ utils/
│     ├─ errors.ts                   # Typed HTTP errors
│     └─ location.ts                 # Structured location normalization/comparison
├─ Dockerfile
├─ package.json
├─ tsconfig.json
└─ .env                              # Local environment variables (not committed in real projects)
```

## API surface

All API routes are mounted under `/api`.
`/health` and `/api/version` are public diagnostics.

### Public auth routes (no token required)

- `POST /api/auth/caregiver/signup`
- `POST /api/auth/care_seeker/signup`
- `POST /api/auth/login`

### Protected routes (JWT required)

`src/routes/index.ts` applies `authMiddleware` globally after auth routes.

#### Caregiver routes

- `GET /api/caregiver/profile`
- `POST /api/caregiver/profile` (upsert)
- `PUT /api/caregiver/profile`
- `GET /api/caregiver/job-accept-requests`
- `GET /api/caregiver/accepted-jobs`
- `POST /api/caregiver/job-accept-requests/:requestId/accept`

#### Care seeker routes

- `GET /api/seekers/profile`
- `POST /api/seekers/profile` (upsert)
- `PUT /api/seekers/profile`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `PATCH /api/jobs/:jobId`
- `DELETE /api/jobs/:jobId`
- `GET /api/jobs/:jobId/matches`
- `POST /api/jobs/:jobId/accept`

#### Shared routes

- `GET /api/experience-options`
- `POST /api/experience-options` (caregiver role)
- `GET /api/skill-options`
- `POST /api/skill-options` (caregiver role)

## Data model (summary)

Core tables include:

- `users`
- `caregiver_profiles`
- `care_seeker_profiles`
- `care_requests`
- `matches`
- `experience_options`
- `skill_options`
- `job_accept_requests`

Schema evolution is managed via SQL migrations in `src/db/migrations/`.

## Key design decisions

- Role-segmented APIs: role checks happen server-side (`requireRole`) even if UI routing also guards by role.
- Upsert-style profile endpoints: `POST` profile endpoints create or update to simplify onboarding flows.
- Matching as a service layer concern: `matchingService` is triggered after create/update job operations, not embedded in route files.
- Structured + legacy location support: matching normalizes both structured fields and legacy strings for backward compatibility.
- Consistent response envelope: API responses use `{ success, data }` or `{ success: false, error }`.

## Matching behavior

`src/services/matchingService.ts` matches caregivers to jobs using:

1. Availability overlap (structured slot comparison when possible, token fallback otherwise)
2. Regional location compatibility
3. Required experience coverage (skills, experience tags, or free-text experience)

Matches are stored in `matches`, and refreshed on job updates.

## Environment variables

Validated in `src/config/env.ts`.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development \| production \| test` |
| `PORT` | No | `3000` | App listen port |
| `DATABASE_URL` | Yes | - | Must start with `postgresql://` or `postgres://` |
| `JWT_SECRET` | Yes | - | Minimum 32 chars |
| `JWT_EXPIRE` | No | `7d` | JWT expiry string |
| `BCRYPT_ROUNDS` | No | `10` | Password hash cost |
| `LOG_LEVEL` | No | `info` | `error \| warn \| info \| debug` |

## Run instructions

### Local development

```bash
cd backend
npm install
npm run dev
```

Backend runs on the configured `PORT` (project default currently uses `3001` in local `.env`).

### Build and run

```bash
npm run build
npm start
```

### Docker Compose (from repo root)

```bash
docker compose up --build
```

In Compose:

- backend is exposed at `http://localhost:3001`
- backend connects to DB using service hostname `db`

## Scripts

- `npm run dev` - nodemon + ts-node hot reload
- `npm run build` - TypeScript compile to `dist/`
- `npm start` - run compiled server
- `npm run lint` - ESLint over `src/**/*.ts`

## Error handling and observability

- Domain/validation/auth errors are raised as typed `AppError` subclasses.
- `errorHandler` maps these to HTTP status codes and stable payloads.
- Unexpected errors return `500` with sanitized message and are logged via Winston.

## Employer review notes

This backend is designed to demonstrate:

- pragmatic layered architecture for a TypeScript API
- role-aware authorization and input validation
- SQL-backed domain workflows (matching + acceptance lifecycle)
- maintainable extension points via service/repository boundaries
