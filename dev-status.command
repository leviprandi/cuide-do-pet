#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
RUN_DIR="$PROJECT_ROOT/.run"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"

print_pid_status() {
  local label="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    printf ' - %s PID file: missing (%s)\n' "$label" "$pid_file"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"

  if [ -z "$pid" ]; then
    printf ' - %s PID file: empty (%s)\n' "$label" "$pid_file"
    return 0
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    printf ' - %s PID file: present, process alive (PID %s)\n' "$label" "$pid"
  else
    printf ' - %s PID file: present, process not running (stale PID %s)\n' "$label" "$pid"
  fi
}

print_endpoint_status() {
  local label="$1"
  local url="$2"

  if curl -fsS "$url" >/dev/null 2>&1; then
    printf ' - %s: responding (%s)\n' "$label" "$url"
  else
    printf ' - %s: not responding (%s)\n' "$label" "$url"
  fi
}

printf '==> Docker containers\n'
if command -v docker >/dev/null 2>&1; then
  (
    cd "$PROJECT_ROOT" || exit 1
    docker compose ps
  ) || {
    printf '[ERROR] Step failed: docker compose ps\n' >&2
    printf '[ERROR] Command/endpoint: cd "%s" && docker compose ps\n' "$PROJECT_ROOT" >&2
    exit 1
  }
else
  printf '[ERROR] Step failed: required command check\n' >&2
  printf '[ERROR] Command/endpoint: command -v docker\n' >&2
  exit 1
fi

printf '\n==> HTTP checks\n'
print_endpoint_status backend "$BACKEND_URL"
print_endpoint_status frontend "$FRONTEND_URL"

printf '\n==> PID files\n'
print_pid_status backend "$BACKEND_PID_FILE"
print_pid_status frontend "$FRONTEND_PID_FILE"

printf '\n==> Logs\n'
printf ' - backend log: %s\n' "$BACKEND_LOG"
printf ' - frontend log: %s\n' "$FRONTEND_LOG"
