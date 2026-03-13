$ErrorActionPreference = "Stop"

Write-Host "Seeding dummy data into Postgres (Compose backend)..." -ForegroundColor Cyan

docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start docker compose services." -ForegroundColor Red
    exit 1
}

docker compose exec -T backend npm run seed:dummy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dummy seed failed." -ForegroundColor Red
    exit 1
}

Write-Host "Dummy data seeded successfully." -ForegroundColor Green
