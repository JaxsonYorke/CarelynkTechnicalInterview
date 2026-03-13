# 🎯 Quick Start - Backend Setup Complete

## ✅ Everything is Ready

Your backend is fully configured and ready to run. Here's what you need to know:

---

## 🚀 Start Development (3 Steps)

### Step 1: Start PostgreSQL Database
```bash
cd backend
docker compose up -d
```

**What this does:**
- Starts a PostgreSQL container
- Database name: `carelynk`
- Username: `postgres` / Password: `postgres`
- Port: `5432`

### Step 2: Start the Backend
```bash
npm run dev
```

**What you should see:**
```
[dotenv] injecting env from .env
✓ Migration 001_initial_schema.sql completed successfully
All migrations completed successfully
Server running on port 3000 in development mode
```

### Step 3: Test It Works
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{"status":"ok","timestamp":"2026-03-13T03:00:00.000Z"}
```

---

## 📊 What's Running

| Component | Details |
|-----------|---------|
| **Backend API** | http://localhost:3000 |
| **PostgreSQL** | localhost:5432 |
| **Database** | `carelynk` |
| **Username** | postgres |
| **Password** | postgres |

---

## 📁 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Your configuration (local development) |
| `docker-compose.yml` | PostgreSQL container setup |
| `README.md` | Backend documentation |
| `CONNECTION_GUIDE.md` | Connection string explained |
| `DOCKER_SETUP.md` | Detailed Docker setup |

---

## 🔌 Connection String

Your backend automatically uses:
```
postgresql://postgres:postgres@localhost:5432/carelynk
```

This is set in `.env` as `DATABASE_URL`.

---

## 🛑 Stopping the Database

When you're done:
```bash
docker compose down
```

Your data is saved! Run `docker compose up -d` anytime to restart.

---

## 🗑️ Full Reset (Delete Everything)

```bash
docker compose down -v
docker compose up -d
```

The `-v` flag deletes the data. Migrations will re-run automatically.

---

## 📚 Available Endpoints

Currently working:

| Endpoint | Method | Response |
|----------|--------|----------|
| `/health` | GET | `{"status":"ok","timestamp":"..."}` |
| `/api/version` | GET | `{"version":"1.0.0"}` |

More endpoints coming in Phase 3+!

---

## 🎯 Architecture Overview

```
Frontend (React)
        ↓
    npm run dev
        ↓
HTTP Requests
        ↓
Backend API (Express)
   http://localhost:3000
        ↓
   Connection Pool
        ↓
PostgreSQL Database
   localhost:5432
```

---

## ✅ Checklist

Before you start, make sure:

- [ ] Docker Desktop is installed and running
- [ ] You're in the `backend` directory
- [ ] `.env` file exists (it should)
- [ ] `docker-compose.yml` exists (it should)

Then:

- [ ] Run `docker compose up -d`
- [ ] Wait 5 seconds for PostgreSQL to start
- [ ] Run `npm run dev`
- [ ] Test with `curl http://localhost:3000/health`

---

## 🆘 Troubleshooting

### "docker: command not found"
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart your terminal

### "Port 5432 already in use"
- Another PostgreSQL is running
- Or: `docker compose down` first, then `docker compose up -d`

### "Connection refused"
- PostgreSQL isn't running: `docker compose up -d`
- Wait 5 seconds, it needs time to start

### "Database does not exist"
- Kill and restart: `docker compose down -v && docker compose up -d`
- This resets the database and migrations

---

## 📖 Documentation

- **README.md** - Full backend documentation
- **CONNECTION_GUIDE.md** - Connection strings explained (IPv6, Supabase, etc.)
- **DOCKER_SETUP.md** - Docker setup details

---

## 🎊 Next Phase

Once the backend is running, we move to **Phase 3: Authentication Service**

You'll implement:
- JWT token generation
- Password hashing with Bcrypt
- Login/signup logic
- Auth endpoints

---

## 💡 Tips

1. **Keep Docker running** while developing
   - Don't close the `docker-compose` container

2. **Hot reload works**
   - Change TypeScript files, backend reloads automatically
   - `npm run dev` watches for changes

3. **Check logs**
   - All logs go to: `logs/all.log` and `logs/error.log`

4. **Database persists**
   - Data stays when you `docker compose down`
   - Use `-v` flag to delete data: `docker compose down -v`

---

## 🚀 Ready?

```bash
cd backend
docker compose up -d
npm run dev
```

Your backend is ready! 🎉

---

**Questions?** See the guides in this directory or check `README.md` for detailed info.
