#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Seeding dummy data into Postgres (Compose backend)..."

  docker compose up -d
  docker compose exec -T backend npm run seed:dummy
else
  echo "Docker not available. Seeding against local database via backend/.env..."
  echo "Make sure local PostgreSQL is running at localhost:5432 and database 'carelynk' exists."

  (
    cd backend
    npm run seed:dummy
  )
fi

echo "Dummy data seeded successfully."
