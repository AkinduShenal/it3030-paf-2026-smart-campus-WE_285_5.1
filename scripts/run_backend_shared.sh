#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env.shared"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Create it from backend/.env.shared.example"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${DB_URL:?DB_URL is required in backend/.env.shared}"
: "${DB_USERNAME:?DB_USERNAME is required in backend/.env.shared}"
: "${DB_PASSWORD:?DB_PASSWORD is required in backend/.env.shared}"

cd "$ROOT_DIR/backend"
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
