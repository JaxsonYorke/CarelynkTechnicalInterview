# Connection String Guide

## TL;DR - Just Use Local Docker ✅

```bash
# Your .env already has this:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carelynk

# Start it with:
docker compose up -d

# Then run:
npm run dev
```

**No IPv6 issues. No network issues. Just works.** ✨

---

## What's the IPv6 Message?

When you use **Supabase's Direct connection string**, it tries to connect directly to the PostgreSQL server. Some environments don't support IPv6 (a newer internet protocol), so it fails.

---

## Connection String Types Explained

### 1. LOCAL (Recommended for Development) ✅
```
postgresql://postgres:postgres@localhost:5432/carelynk
```
- No network involved
- No IPv6 issues
- Fast and reliable
- Use with Docker

### 2. Supabase - Session Pooler
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?sslmode=require
```
- For web applications
- Cheaper than direct
- **This usually works better than Direct**

### 3. Supabase - Transaction Pooler
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?sslmode=require
```
- For frequent connections
- Similar to session pooler

### 4. Supabase - Direct (⚠️ IPv6 Issues)
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```
- Direct connection to PostgreSQL
- **May fail if IPv6 not supported**
- ❌ Don't use this unless you know your system supports IPv6

---

## If You MUST Use Supabase

### Step 1: Get the Right Connection String

Go to **Supabase Dashboard** → **Project Settings** → **Database**

Look for connection strings. Pick **Session Pooler** (not Direct):
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres
```

### Step 2: Add SSL Mode

Add `?sslmode=require` to the end:
```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?sslmode=require
```

### Step 3: Update .env

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:6543/postgres?sslmode=require
```

Replace `[YOUR_PASSWORD]` with your actual Supabase password.

### Step 4: Test Connection

```bash
npm run dev
```

---

## Checking IPv6 Support (Windows)

If you're curious about your system:

```powershell
# Check if IPv6 is enabled
ipconfig /all | findstr "IPv6"

# Try to resolve IPv6 address
ping -6 ::1
```

But honestly, you don't need to worry about this. Just use **Docker locally** for development!

---

## Recommendation

| Use Case | Connection | Setup |
|----------|-----------|-------|
| **Local Development** | Local Docker | `docker compose up -d` |
| **Production** | Supabase (Session Pooler) | Use connection string from Supabase dashboard |
| **Staging** | Supabase (Session Pooler) | Same as production |

---

## Current Setup

Your `.env` is already configured for **local Docker**:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carelynk
```

Just run:
```bash
docker compose up -d
npm run dev
```

And you're good to go! 🚀

---

## Troubleshooting

### "Connection refused"
- PostgreSQL container not running: `docker compose up -d`

### "Database does not exist"
- Wait a few seconds for PostgreSQL to start
- Check: `docker compose ps` (should show "healthy")

### Still getting IPv6 errors with Supabase
- Use Session Pooler, not Direct
- Make sure connection string ends with `?sslmode=require`
- Check your password doesn't have special characters that need escaping

---

**Bottom line: Use the local Docker setup. It's easier and faster.** ✨
