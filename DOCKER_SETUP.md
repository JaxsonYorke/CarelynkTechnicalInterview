# Docker Installation and Local Setup Guide

This guide combines Docker installation instructions and project setup steps in one place.

## Why Docker is used in this project

The project runs PostgreSQL in Docker for consistent local development and to avoid host-specific database/network setup issues.

Benefits:

- reproducible local DB environment
- simple start/stop/reset workflow
- no separate PostgreSQL installation required

## Prerequisites

- Windows 10/11, macOS, or Linux
- Docker Desktop (or Docker Engine + Compose v2 plugin)
- Node.js 18+
- npm 9+

## Install Docker Desktop

1. Download Docker Desktop: <https://www.docker.com/products/docker-desktop>
2. Run installer with admin privileges.
3. Enable WSL 2 when prompted (Windows).
4. Restart machine if installer requests it.

Verify installation:

```powershell
docker --version
docker compose version
docker run hello-world
```

## Recommended: one-command project bootstrap

From repo root, run:

- Windows:

```powershell
.\run-project.ps1
```

- Linux/macOS:

```bash
chmod +x ./run-project.sh
./run-project.sh
```

What this does:

- validates required tools (`docker`, `docker compose`, `node`, `npm`)
- creates missing env files (`backend/.env`, `frontend/.env`)
- installs backend/frontend dependencies
- starts the full Compose stack
- optionally imports `.dump` / `.sql` data

## Manual Docker workflow (fallback)

From repository root:

```bash
docker compose up -d --build --force-recreate
docker compose ps
```

Default services:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`
- postgres: `localhost:5432`

Stop services:

```bash
docker compose down
```

Reset DB data:

```bash
docker compose down -v
```

## Database connection defaults

Compose backend uses:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/carelynk
```

Local host connection (for external DB clients):

```env
Host=localhost
Port=5432
User=postgres
Password=postgres
Database=carelynk
```

## Optional dummy data import

Bootstrap scripts can import data automatically from:

- `./*.dump` / `./*.sql`
- `./seed/*.dump` / `./seed/*.sql`
- `./data/*.dump` / `./data/*.sql`
- `./db/*.dump` / `./db/*.sql`

Force re-import:

- PowerShell:
  - `$env:FORCE_DUMP_IMPORT="1"; .\run-project.ps1`
- Bash:
  - `FORCE_DUMP_IMPORT=1 ./run-project.sh`

Explicit file path:

- PowerShell: `.\run-project.ps1 -DumpFile .\seed\dummy.dump`
- Bash: `./run-project.sh ./seed/dummy.dump`

## Troubleshooting

### `docker: command not found`

- Install Docker Desktop.
- Restart terminal.

### Docker daemon not running

- Start Docker Desktop and wait for "Engine running".
- Re-run script/command.

### Backend error: `ENOTFOUND db` / `ENOTFOUND postgres`

- Do not use Docker Desktop "Run" for individual images.
- Use repo-root Compose flow:

```bash
docker compose down --remove-orphans
docker compose up -d --build --force-recreate
```

### Port 5432 already in use

- Another local PostgreSQL is using port 5432.
- Stop the other service or change port mapping in `docker-compose.yml`.

### Container starts but app still fails

- Check logs:

```bash
docker compose logs backend --tail 100
docker compose logs postgres --tail 100
```

## Next steps

1. Run bootstrap script from repo root.
2. Open frontend at `http://localhost:3000`.
3. Use backend health check at `http://localhost:3001/health`.
