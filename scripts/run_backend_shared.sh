#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED_ENV_FILE="$ROOT_DIR/backend/.env.shared"
LOCAL_ENV_FILE="$ROOT_DIR/backend/.env"

if [[ ! -f "$SHARED_ENV_FILE" ]]; then
  echo "Missing $SHARED_ENV_FILE"
  echo "Create it from backend/.env.shared.example"
  exit 1
fi

set -a
source "$SHARED_ENV_FILE"
set +a

SHARED_DB_URL="$DB_URL"
SHARED_DB_USERNAME="$DB_USERNAME"
SHARED_DB_PASSWORD="$DB_PASSWORD"

if [[ -f "$LOCAL_ENV_FILE" ]]; then
  set -a
  source "$LOCAL_ENV_FILE"
  set +a
fi

# Keep the team on the same database even when local auth settings are overridden.
export DB_URL="$SHARED_DB_URL"
export DB_USERNAME="$SHARED_DB_USERNAME"
export DB_PASSWORD="$SHARED_DB_PASSWORD"

: "${DB_URL:?DB_URL is required in backend/.env.shared}"
: "${DB_USERNAME:?DB_USERNAME is required in backend/.env.shared}"
: "${DB_PASSWORD:?DB_PASSWORD is required in backend/.env.shared}"

cd "$ROOT_DIR/backend"
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
