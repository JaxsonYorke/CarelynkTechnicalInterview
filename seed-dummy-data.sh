#!/usr/bin/env bash
set -euo pipefail

echo "Seeding dummy data into Postgres (Compose backend)..."

docker compose up -d
docker compose exec -T backend npm run seed:dummy

echo "Dummy data seeded successfully."
