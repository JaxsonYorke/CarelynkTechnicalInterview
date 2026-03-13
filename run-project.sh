#!/usr/bin/env bash
# One-command bootstrap script for Linux/macOS Bash

set -euo pipefail
DUMP_FILE="${1:-${DUMP_FILE:-}}"
FORCE_DUMP_IMPORT="${FORCE_DUMP_IMPORT:-0}"

step() {
  echo
  echo "==> $1"
}

ensure_command() {
  local name="$1"
  local hint="$2"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "ERROR: '$name' is not installed or not on PATH."
    echo "$hint"
    exit 1
  fi
}

ensure_docker_daemon() {
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker daemon is not running."
    echo "Start Docker Desktop / Docker Engine, then rerun this script."
    exit 1
  fi
}

ensure_env_file() {
  local path="$1"
  local content="$2"
  if [[ -f "$path" ]]; then
    echo "Keeping existing $path"
    return
  fi

  mkdir -p "$(dirname "$path")"
  printf "%s\n" "$content" >"$path"
  echo "Created $path"
}

resolve_dump_file() {
  local requested="$1"
  if [[ -n "$requested" ]]; then
    if [[ ! -f "$requested" ]]; then
      echo "ERROR: Dump file not found: $requested"
      exit 1
    fi
    echo "$requested"
    return
  fi

  local dirs=( "." "./seed" "./data" "./db" )
  local file
  for dir in "${dirs[@]}"; do
    [[ -d "$dir" ]] || continue

    file="$(find "$dir" -maxdepth 1 -type f -name '*.dump' | head -n 1 || true)"
    if [[ -n "$file" ]]; then
      echo "$file"
      return
    fi

    file="$(find "$dir" -maxdepth 1 -type f -name '*.sql' | head -n 1 || true)"
    if [[ -n "$file" ]]; then
      echo "$file"
      return
    fi
  done
}

import_dump_if_present() {
  local resolved
  resolved="$(resolve_dump_file "$DUMP_FILE")"
  if [[ -z "${resolved:-}" ]]; then
    echo "No dump file found (.dump/.sql in root, seed/, data/, db/) - skipping data import."
    return
  fi

  local user_count
  user_count="$(docker compose exec -T postgres psql -U postgres -d carelynk -tAc "SELECT CASE WHEN to_regclass('public.users') IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM public.users) END;" | tr -d '[:space:]')"
  if [[ "${user_count:-0}" -gt 0 && "$FORCE_DUMP_IMPORT" != "1" ]]; then
    echo "Database already has users (${user_count}). Skipping dump import."
    echo "Set FORCE_DUMP_IMPORT=1 to force re-import."
    return
  fi

  step "Importing dump data from $resolved"
  local container_id
  container_id="$(docker compose ps -q postgres)"
  if [[ -z "$container_id" ]]; then
    echo "ERROR: Could not find postgres container in compose stack."
    exit 1
  fi

  local file_name
  file_name="$(basename "$resolved")"
  local target_path="/tmp/$file_name"

  docker cp "$resolved" "${container_id}:${target_path}"

  local magic
  magic="$(head -c 5 "$resolved" || true)"
  if [[ "$magic" == "PGDMP" ]]; then
    docker compose exec -T postgres pg_restore --clean --if-exists --no-owner --no-privileges -U postgres -d carelynk "$target_path"
  else
    docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d carelynk -f "$target_path"
  fi

  echo "Dump import completed."
}

echo "Carelynk project bootstrap (Bash)"

step "Checking prerequisites"
ensure_command "docker" "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
ensure_command "node" "Install Node.js 18+: https://nodejs.org/"
ensure_command "npm" "npm ships with Node.js. Reinstall Node.js if missing."

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: 'docker compose' plugin is not available."
  echo "Use Docker Desktop / Docker Engine with Compose v2."
  exit 1
fi

ensure_docker_daemon

step "Creating missing environment files"
ensure_env_file "backend/.env" "NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carelynk
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-required
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
LOG_LEVEL=debug"

ensure_env_file "frontend/.env" "REACT_APP_API_BASE_URL=http://localhost:3001"

step "Installing dependencies"
(
  cd backend
  npm install
)

(
  cd frontend
  npm install
)

step "Starting Docker Compose stack"
docker compose down --remove-orphans
docker compose up -d --build --force-recreate

import_dump_if_present

step "Current container status"
docker compose ps

echo
echo "Done."
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "DB:       localhost:5432"
echo
echo "Use 'docker compose logs -f backend' to watch backend logs."
