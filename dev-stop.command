#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
RUN_DIR="$PROJECT_ROOT/.run"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

stop_from_pid_file() {
  local label="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    printf '[INFO] %s PID file not found: %s\n' "$label" "$pid_file"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [ -z "$pid" ]; then
    printf '[INFO] %s PID file is empty, removing stale file: %s\n' "$label" "$pid_file"
    rm -f "$pid_file"
    return 0
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    printf '[INFO] Stopping %s (PID %s)\n' "$label" "$pid"
    kill "$pid" >/dev/null 2>&1 || true

    local attempts=10
    local count=1
    while [ "$count" -le "$attempts" ]; do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
      sleep 1
      count=$((count + 1))
    done

    if kill -0 "$pid" >/dev/null 2>&1; then
      printf '[INFO] %s still running after SIGTERM, sending SIGKILL to PID %s\n' "$label" "$pid"
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
  else
    printf '[INFO] %s already stopped; removing stale PID file: %s\n' "$label" "$pid_file"
  fi

  rm -f "$pid_file"
}

printf '==> Stopping frontend and backend\n'
stop_from_pid_file frontend "$FRONTEND_PID_FILE"
stop_from_pid_file backend "$BACKEND_PID_FILE"

printf '\n==> Stopping database containers\n'
if command -v docker >/dev/null 2>&1; then
  (
    cd "$PROJECT_ROOT" || exit 1
    docker compose stop
  ) || {
    printf '[ERROR] Step failed: docker compose stop\n' >&2
    printf '[ERROR] Command/endpoint: cd "%s" && docker compose stop\n' "$PROJECT_ROOT" >&2
    exit 1
  }
else
  printf '[ERROR] Step failed: required command check\n' >&2
  printf '[ERROR] Command/endpoint: command -v docker\n' >&2
  exit 1
fi

printf '\n[OK] Stop routine finished.\n'
printf ' - frontend PID file: %s\n' "$FRONTEND_PID_FILE"
printf ' - backend PID file: %s\n' "$BACKEND_PID_FILE"
