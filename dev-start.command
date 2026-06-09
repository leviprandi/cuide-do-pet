#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
RUN_DIR="$PROJECT_ROOT/.run"
LOG_DIR="$PROJECT_ROOT/logs"
API_DIR="$PROJECT_ROOT/apps/api"
WEB_DIR="$PROJECT_ROOT/apps/web"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_URL="http://localhost:3001/health"
FRONTEND_URL="http://localhost:3000"

print_step() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\n[ERROR] Step failed: %s\n' "$1" >&2
  if [ "${2:-}" != "" ]; then
    printf '[ERROR] Command/endpoint: %s\n' "$2" >&2
  fi
  if [ "${3:-}" != "" ] && [ -f "$3" ]; then
    printf '[ERROR] Last 60 lines of %s:\n' "$3" >&2
    tail -n 60 "$3" >&2
  fi
  exit 1
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "required command check" "command -v $command_name"
  fi
}

ensure_directories() {
  mkdir -p "$RUN_DIR" "$LOG_DIR" || fail "create runtime directories" "mkdir -p \"$RUN_DIR\" \"$LOG_DIR\""
}

port_listener_info() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null
}

ensure_port_free() {
  local port="$1"
  local service_name="$2"
  local listener_info

  listener_info="$(port_listener_info "$port")"
  if [ -n "$listener_info" ]; then
    printf '\n[ERROR] Step failed: %s port availability check\n' "$service_name" >&2
    printf '[ERROR] Command/endpoint: lsof -nP -iTCP:%s -sTCP:LISTEN\n' "$port" >&2
    printf '[ERROR] Port %s is already in use by:\n%s\n' "$port" "$listener_info" >&2
    exit 1
  fi
}

wait_for_http() {
  local url="$1"
  local service_name="$2"
  local log_file="$3"
  local pid_file="$4"
  local attempts=60
  local count=1

  while [ "$count" -le "$attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    if [ -f "$pid_file" ]; then
      local pid
      pid="$(cat "$pid_file")"
      if [ -n "$pid" ] && ! kill -0 "$pid" >/dev/null 2>&1; then
        fail "$service_name startup" "$url" "$log_file"
      fi
    fi

    sleep 1
    count=$((count + 1))
  done

  fail "$service_name startup timeout" "$url" "$log_file"
}

start_backend() {
  print_step "Starting backend"
  : > "$BACKEND_LOG" || fail "prepare backend log" "$BACKEND_LOG"

  (
    cd "$API_DIR" || exit 1
    exec npm run start:dev
  ) >>"$BACKEND_LOG" 2>&1 &

  local backend_pid=$!
  printf '%s\n' "$backend_pid" > "$BACKEND_PID_FILE" || fail "write backend PID" "$BACKEND_PID_FILE"

  wait_for_http "$BACKEND_URL" "backend" "$BACKEND_LOG" "$BACKEND_PID_FILE"
}

start_frontend() {
  print_step "Starting frontend"
  : > "$FRONTEND_LOG" || fail "prepare frontend log" "$FRONTEND_LOG"

  (
    cd "$WEB_DIR" || exit 1
    exec npm run dev
  ) >>"$FRONTEND_LOG" 2>&1 &

  local frontend_pid=$!
  printf '%s\n' "$frontend_pid" > "$FRONTEND_PID_FILE" || fail "write frontend PID" "$FRONTEND_PID_FILE"

  wait_for_http "$FRONTEND_URL" "frontend" "$FRONTEND_LOG" "$FRONTEND_PID_FILE"
}

print_summary() {
  printf '\n[OK] Local development stack started successfully.\n'
  printf ' - database started via docker compose\n'
  printf ' - backend URL: %s\n' "$BACKEND_URL"
  printf ' - frontend URL: %s\n' "$FRONTEND_URL"
  printf ' - backend log: %s\n' "$BACKEND_LOG"
  printf ' - frontend log: %s\n' "$FRONTEND_LOG"
}

print_step "Checking required commands"
require_command docker
require_command npm
require_command node
require_command curl

print_step "Preparing runtime directories"
ensure_directories

print_step "Starting database containers"
(
  cd "$PROJECT_ROOT" || exit 1
  docker compose up -d
) || fail "docker compose up" "cd \"$PROJECT_ROOT\" && docker compose up -d"

print_step "Checking backend port 3001"
ensure_port_free 3001 backend
start_backend

print_step "Checking frontend port 3000"
ensure_port_free 3000 frontend
start_frontend

print_summary
