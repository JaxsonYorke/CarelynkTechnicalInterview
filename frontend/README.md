# Carelynk Frontend

React + TypeScript client for the Carelynk homecare MVP.  
The frontend provides separate caregiver and care seeker flows, JWT-based session handling, and role-protected routing.

## Tech stack

- Framework: React 19 + TypeScript
- Routing: `react-router-dom` (data-router API via `createBrowserRouter`)
- Forms: `react-hook-form`
- HTTP: Fetch wrapper in `src/services/api.ts`
- Build tooling: `react-scripts` (CRA-based setup)

## Product behavior covered in UI

- Public landing experience
- Auth for both user roles
- Caregiver onboarding/profile + accepted job workflow
- Care seeker profile + job request creation/editing + match review
- Role-based route protection on client side

## Frontend architecture

### Routing and composition

- `src/App.tsx` mounts the router only.
- `src/Router.tsx` defines all routes and wraps them in `AuthProvider`.
- `src/components/ProtectedRoute.tsx` enforces auth and role checks before rendering portal routes.

### Auth/session state

- `src/context/AuthContext.tsx` holds user/token/loading/error state.
- JWT is read from local storage on app boot and decoded client-side (`src/utils/auth.ts`).
- Auth header injection happens centrally in `src/services/api.ts`.

### API integration

- `apiCall` in `src/services/api.ts` handles:
  - base URL composition
  - JSON parsing
  - auth header attachment
  - HTTP/non-HTTP error normalization
  - token clearing on `401`

- Base URL is configured via:
  - `REACT_APP_API_BASE_URL` (preferred)
  - fallback: `http://localhost:3001`

## Project structure

```text
frontend/
├─ src/
│  ├─ App.tsx                         # Root app component
│  ├─ Router.tsx                      # Full route tree (public + role-protected)
│  ├─ context/
│  │  └─ AuthContext.tsx              # Global auth/session state
│  ├─ components/
│  │  └─ ProtectedRoute.tsx           # Auth + role route guard
│  ├─ pages/
│  │  ├─ Landing.tsx                  # Public landing page
│  │  ├─ NotFound.tsx                 # 404 page
│  │  ├─ auth/                        # Signup/login forms per role
│  │  ├─ caregiver/                   # Caregiver dashboard/profile/onboarding/accepted jobs
│  │  └─ seeker/                      # Seeker dashboard/profile/jobs/matches
│  ├─ services/
│  │  └─ api.ts                       # HTTP utility and typed convenience methods
│  ├─ utils/
│  │  ├─ constants.ts                 # API endpoints, storage keys, UX constants
│  │  ├─ auth.ts                      # JWT localStorage/decode helpers
│  │  ├─ validators.ts                # Form validation helpers
│  │  ├─ location.ts                  # Location transformation helpers
│  │  └─ availability.ts              # Availability parsing/formatting helpers
│  ├─ types/
│  │  └─ index.ts                     # Shared frontend interfaces
│  └─ index.tsx                       # React entrypoint
├─ Dockerfile
├─ package.json
└─ README.md
```

## Route map

### Public routes

- `/` - Landing
- `/auth/caregiver/signup`
- `/auth/caregiver/login`
- `/auth/seeker/signup`
- `/auth/seeker/login`

### Caregiver portal routes (requires `caregiver` role)

- `/caregiver/dashboard`
- `/caregiver/profile`
- `/caregiver/onboarding`
- `/caregiver/accepted-jobs`

### Care seeker portal routes (requires `care_seeker` role)

- `/seeker/dashboard`
- `/seeker/profile`
- `/seeker/create-job`
- `/seeker/jobs/:jobId/edit`
- `/seeker/my-jobs`
- `/seeker/matches/:jobId`

## Design decisions

- Single API module: all requests route through one service to keep auth, errors, and response handling consistent.
- Client role guard + server role guard: frontend improves UX with protected routes, while backend remains source of truth.
- Local-storage JWT persistence: keeps refresh behavior simple for this MVP and supports route restoration on reload.
- Domain-oriented pages: caregiver and seeker paths are physically separated to reduce role-flow coupling.

## Environment configuration

Create `.env` in `frontend/` when needed:

```bash
REACT_APP_API_BASE_URL=http://localhost:3001
```

If omitted, the app defaults to `http://localhost:3001`.

## Run instructions

### Local development

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`.

### Build

```bash
npm run build
```

`npm run build` runs `node ./scripts/build-with-webpack-fix.cjs`, which invokes `react-scripts build` with a Node/OpenSSL compatibility flag.

### Tests

```bash
npm test
```

### Docker Compose (from repo root)

```bash
docker compose up --build
```

In Compose:

- frontend runs at `http://localhost:3000`
- frontend calls backend at `http://localhost:3001`

## Scripts

- `npm start` - dev server
- `npm run build` - runs `node ./scripts/build-with-webpack-fix.cjs` (compat wrapper around `react-scripts build`)
- `npm test` - test runner
- `npm run eject` - CRA eject (irreversible)

## Employer review notes

This frontend demonstrates:

- clean role-based portal separation
- practical auth/session handling with route-level protection
- centralized API contract handling
- maintainable module layout for feature expansion
