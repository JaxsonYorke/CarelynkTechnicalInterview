# Local Development Setup Guide

## Problem

You were getting `ENOTFOUND` error when trying to connect to Supabase:
```
Error: getaddrinfo ENOTFOUND db.rnbuxjhjnuapjjnvdtzr.supabase.co
```

This means your machine **cannot reach the Supabase database server** (likely due to network/firewall restrictions).

## Solution: Local PostgreSQL with Docker

For local development, we've set up a **local PostgreSQL database** using Docker.

### Prerequisites

- **Docker Desktop** installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker running on your machine

### Quick Start

#### 1. Start PostgreSQL Container

```bash
cd backend
docker-compose up -d
```

This starts a PostgreSQL database container:
- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** postgres
- **Database:** carelynk

#### 2. Verify Database is Running

```bash
docker-compose ps
```

You should see:
```
CONTAINER ID   IMAGE              STATUS                   PORTS
abc123...      postgres:15-alpine  Up X seconds (healthy)   0.0.0.0:5432->5432/tcp
```

#### 3. Start the Backend

```bash
npm run dev
```

You should see:
```
Database connection established
✓ Migration 001_initial_schema.sql completed successfully
All migrations completed successfully
Server running on port 3000 in development mode
```

### Using the Backend

The backend is now running on `http://localhost:3000`:

- `GET /health` - Health check
- `GET /api/version` - API version
- Other endpoints coming in Phase 3+

### Stopping PostgreSQL

```bash
docker-compose down
```

### Restarting (Keep Data)

```bash
docker-compose up -d
```

### Complete Reset (Delete Data)

```bash
docker-compose down -v
docker-compose up -d
```

The `-v` flag removes the volume (database data).

---

## .env Configuration

Your `.env` file is now configured for local development:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carelynk
```

| Component | Value |
|-----------|-------|
| Protocol | postgresql:// |
| User | postgres |
| Password | postgres |
| Host | localhost |
| Port | 5432 |
| Database | carelynk |

---

## For Production (Supabase)

When deploying to production:

1. Create a Supabase project
2. Get your PostgreSQL connection string
3. Update `.env` with your Supabase connection:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/[YOUR_DB]
   ```
4. Deploy the backend

---

## Troubleshooting

### "docker: command not found"
- Install Docker Desktop
- Restart your terminal

### "Port 5432 already in use"
- Another PostgreSQL is running
- Either: Stop it, or change the port in `docker-compose.yml` (e.g., `"5433:5432"`)

### "Connection refused"
- PostgreSQL container isn't running: `docker-compose up -d`
- Wait 5 seconds for container to start

### "Database does not exist"
- Migrations failed to run
- Check logs: `docker-compose logs`
- Restart: `docker-compose down && docker-compose up -d`

---

## Next Steps

Now that you have a working database:

1. ✅ Backend can run without errors
2. ⏳ Phase 3: Build authentication service
3. ⏳ Phase 4: Create API endpoints
4. ⏳ Phase 5: Implement matching logic

Happy coding! 🚀
