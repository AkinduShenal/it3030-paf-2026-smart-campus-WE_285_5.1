#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing backend/.env"
  exit 1
fi

set -a
source .env
set +a

SERVER_PORT="${SERVER_PORT:-8080}"
EXISTING_PID="$(lsof -nP -iTCP:"${SERVER_PORT}" -sTCP:LISTEN -t 2>/dev/null || true)"

if [[ -n "${EXISTING_PID}" ]]; then
  echo "Port ${SERVER_PORT} is already in use by PID ${EXISTING_PID}. Restarting backend process..."
  kill ${EXISTING_PID} || true
  sleep 1
fi

mvn spring-boot:run
