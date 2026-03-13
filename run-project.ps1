# One-command bootstrap script for Windows PowerShell
param(
    [string]$DumpFile = ""
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-Command {
    param(
        [string]$Name,
        [string]$Hint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$Name' is not installed or not on PATH." -ForegroundColor Red
        Write-Host $Hint -ForegroundColor Yellow
        exit 1
    }
}

function Ensure-DockerDaemon {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker daemon is not running." -ForegroundColor Red
        Write-Host "Start Docker Desktop, wait until it is ready, then rerun this script." -ForegroundColor Yellow
        exit 1
    }
}

function Ensure-EnvFile {
    param(
        [string]$Path,
        [string[]]$Content
    )

    if (Test-Path $Path) {
        Write-Host "Keeping existing $Path" -ForegroundColor Yellow
        return
    }

    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }

    $Content -join "`n" | Out-File -FilePath $Path -Encoding UTF8 -NoNewline
    Write-Host "Created $Path" -ForegroundColor Green
}

function Get-DumpFilePath {
    param([string]$RequestedDumpFile)

    if ($RequestedDumpFile) {
        if (-not (Test-Path $RequestedDumpFile)) {
            Write-Host "ERROR: Dump file not found: $RequestedDumpFile" -ForegroundColor Red
            exit 1
        }
        return (Resolve-Path $RequestedDumpFile).Path
    }

    $candidateDirs = @(".", ".\seed", ".\data", ".\db")
    foreach ($dir in $candidateDirs) {
        if (-not (Test-Path $dir)) { continue }

        $dump = Get-ChildItem -Path $dir -File -Filter "*.dump" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($dump) { return $dump.FullName }

        $sql = Get-ChildItem -Path $dir -File -Filter "*.sql" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($sql) { return $sql.FullName }
    }

    return $null
}

function Get-IsCustomPgDump {
    param([string]$Path)

    try {
        $stream = [System.IO.File]::OpenRead($Path)
        try {
            $buffer = New-Object byte[] 5
            $read = $stream.Read($buffer, 0, 5)
            if ($read -lt 5) { return $false }
            $header = [System.Text.Encoding]::ASCII.GetString($buffer)
            return $header -eq "PGDMP"
        } finally {
            $stream.Dispose()
        }
    } catch {
        return $false
    }
}

function Import-DumpIfPresent {
    param([string]$RequestedDumpFile)

    $resolvedDump = Get-DumpFilePath -RequestedDumpFile $RequestedDumpFile
    if (-not $resolvedDump) {
        Write-Host "No dump file found (.dump/.sql in root, seed/, data/, db/) - skipping data import." -ForegroundColor Yellow
        return
    }

    $containerId = docker compose ps -q postgres
    if (-not $containerId) {
        Write-Host "ERROR: Could not find postgres container in compose stack." -ForegroundColor Red
        exit 1
    }

    $userCount = docker compose exec -T postgres psql -U postgres -d carelynk -tAc "SELECT CASE WHEN to_regclass('public.users') IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM public.users) END;"
    if ($LASTEXITCODE -ne 0) { exit 1 }
    $trimmedCount = ($userCount | Out-String).Trim()

    if (($trimmedCount -as [int]) -gt 0 -and $env:FORCE_DUMP_IMPORT -ne "1") {
        Write-Host "Database already has users ($trimmedCount). Skipping dump import." -ForegroundColor Yellow
        Write-Host "Set FORCE_DUMP_IMPORT=1 to force re-import." -ForegroundColor Yellow
        return
    }

    Write-Step "Importing dump data from $resolvedDump"
    $fileName = [System.IO.Path]::GetFileName($resolvedDump)
    $targetPath = "/tmp/$fileName"

    docker cp $resolvedDump "${containerId}:$targetPath"
    if ($LASTEXITCODE -ne 0) { exit 1 }

    $isCustomDump = Get-IsCustomPgDump -Path $resolvedDump
    if ($isCustomDump) {
        docker compose exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges -U postgres -d carelynk $targetPath
    } else {
        docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d carelynk -f $targetPath
    }
    if ($LASTEXITCODE -ne 0) { exit 1 }

    Write-Host "Dump import completed." -ForegroundColor Green
}

Write-Host "Carelynk project bootstrap (PowerShell)" -ForegroundColor Green

Write-Step "Checking prerequisites"
Ensure-Command -Name "docker" -Hint "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
Ensure-Command -Name "node" -Hint "Install Node.js 18+: https://nodejs.org/"
Ensure-Command -Name "npm" -Hint "npm ships with Node.js. Reinstall Node.js if missing."

docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: 'docker compose' plugin is not available." -ForegroundColor Red
    Write-Host "Use Docker Desktop with Compose v2 support." -ForegroundColor Yellow
    exit 1
}

Ensure-DockerDaemon

Write-Step "Creating missing environment files"
Ensure-EnvFile -Path ".\backend\.env" -Content @(
    "NODE_ENV=development",
    "PORT=3001",
    "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carelynk",
    "JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-required",
    "JWT_EXPIRE=7d",
    "BCRYPT_ROUNDS=10",
    "LOG_LEVEL=debug"
)
Ensure-EnvFile -Path ".\frontend\.env" -Content @(
    "REACT_APP_API_BASE_URL=http://localhost:3001"
)

Write-Step "Installing dependencies"
Push-Location ".\backend"
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Pop-Location

Push-Location ".\frontend"
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Pop-Location

Write-Step "Starting Docker Compose stack"
docker compose down --remove-orphans
docker compose up -d --build --force-recreate
if ($LASTEXITCODE -ne 0) { exit 1 }

Import-DumpIfPresent -RequestedDumpFile $DumpFile

Write-Step "Current container status"
docker compose ps

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend:  http://localhost:3001"
Write-Host "DB:       localhost:5432"
Write-Host ""
Write-Host "Use 'docker compose logs -f backend' to watch backend logs." -ForegroundColor Cyan
