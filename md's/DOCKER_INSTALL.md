# Docker Desktop Installation Guide

## Current Status

✅ **Already Installed:**
- Node.js v23.2.0
- npm 10.9.0  
- Backend code (complete)
- All npm packages (270+)
- Configuration and documentation

❌ **Missing:**
- Docker Desktop

---

## What is Docker?

Docker is a containerization platform that lets you run PostgreSQL (your database) in an isolated container on your machine. It's like having PostgreSQL installed without actually installing it.

**Benefits:**
- No network issues
- Database starts fresh
- Easy to manage
- Perfect for development

---

## Installation Steps

### Step 1: Download Docker Desktop

Go to: **https://www.docker.com/products/docker-desktop**

Click "Download for Windows"

### Step 2: Run the Installer

1. Open the downloaded file: `Docker Desktop Installer.exe`
2. Windows will ask for admin privileges - **Click "Yes"**
3. Follow the wizard:
   - Accept the License Agreement
   - Choose default installation location
   - Check "WSL 2 Windows Subsystem for Linux"
   - Click "Install"

### Step 3: Restart Your Computer

Docker installation requires a restart to enable virtualization.

**Important:** 
- Save any open work before restarting
- Docker will start automatically on next login
- First startup takes 2-3 minutes

### Step 4: Verify Installation

Open PowerShell and run:
```powershell
docker --version
```

**Expected output:**
```
Docker version 26.x.x (or similar)
```

If you see this, Docker is installed! ✅

---

## System Requirements

Before installing, make sure your system meets these requirements:

### Hardware
- ✅ 64-bit processor (you have this)
- ✅ At least 4GB RAM
- ✅ Virtualization enabled in BIOS (usually default)

### Windows Version
- ✅ Windows 10 (version 1903 or later)
- ✅ Windows 11
- ✅ Any Windows version

### Check Your Windows Version

Press `Win + R`, type `winver`, press Enter.

Look for "Version:" - should be 1903 or higher.

---

## Troubleshooting Installation

### "Docker Desktop requires admin privileges"
- You need admin rights on your computer
- Contact your IT department if on a work computer

### "Cannot enable WSL 2"
- Open PowerShell as Administrator
- Run: `wsl --install`
- Restart computer
- Try Docker installation again

### "Virtualization not enabled"
- Restart computer
- Enter BIOS (usually F2, Del, or F10 during startup)
- Find "Virtualization" or "VT-x"
- Enable it
- Save and exit
- Try Docker installation again

### Docker starts but won't stay running
- Make sure you have enough disk space
- Restart Docker Desktop
- If still failing, reinstall Docker

---

## After Installation

### Verify Docker Works

```powershell
docker run hello-world
```

This downloads and runs a test container. If you see a message, Docker is working!

### Start Your Project

```powershell
cd backend
docker compose up -d
npm run dev
```

Your backend will be running on `http://localhost:3000`

---

## What Docker Will Do

When you run `docker compose up -d`:

1. ✅ Downloads PostgreSQL 15 image (one time, ~300MB)
2. ✅ Creates a container named `carelynk-postgres`
3. ✅ Starts PostgreSQL server on port 5432
4. ✅ Creates database named `carelynk`
5. ✅ Waits for your backend to connect

---

## Docker Desktop Features

Once installed, Docker Desktop provides:

- **Containers tab** - See running containers
- **Images tab** - See downloaded images
- **Volumes tab** - See data storage
- **System status** - See if Docker is running

### Check Container Status

```powershell
docker compose ps
```

Shows: container name, status, ports

### View Logs

```powershell
docker compose logs
```

Shows what's happening in the container

---

## Stopping Docker

When you're done developing:

```powershell
docker compose down
```

This stops the PostgreSQL container but keeps your data.

### Reset Everything

If you want to start fresh:

```powershell
docker compose down -v
docker compose up -d
```

The `-v` flag deletes all data.

---

## FAQ

**Q: Do I need to restart Docker after each code change?**
A: No, it runs in the background. Just code away!

**Q: How much disk space does Docker need?**
A: PostgreSQL image is ~300MB, database will grow based on data.

**Q: Can I see the database?**
A: Yes, use pgAdmin or any PostgreSQL client:
```
Host: localhost
Port: 5432
User: postgres
Password: postgres
Database: carelynk
```

**Q: What if Docker stops unexpectedly?**
A: Run: `docker compose up -d` to restart it.

**Q: Can I uninstall Docker later?**
A: Yes, from Windows Settings > Apps > Docker Desktop.

---

## Next Steps

1. ✅ Download Docker Desktop
2. ✅ Run installer (requires restart)
3. ✅ Verify: `docker --version`
4. ✅ Run: `docker compose up -d` (in backend directory)
5. ✅ Run: `npm run dev`
6. ✅ Backend is live!

---

## Need Help?

- **Docker won't install?** Check Windows version (1903+)
- **Can't enable virtualization?** Check BIOS settings
- **Container won't start?** Check disk space and logs
- **Still stuck?** See DOCKER_SETUP.md for troubleshooting

---

**Installation usually takes 10-15 minutes total.**

Once Docker is running, your backend will work perfectly! 🚀
