#!/bin/bash

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
QA_USER_ID="11111111-1111-4111-8111-111111111111"
QA_USER_EMAIL="qa-local@cuidedopet.test"
QA_USER_NAME="QA Local"

print_step() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\n[ERROR] Step failed: %s\n' "$1" >&2
  if [ "${2:-}" != "" ]; then
    printf '[ERROR] Command/endpoint: %s\n' "$2" >&2
  fi
  exit 1
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "required command check" "command -v $command_name"
  fi
}

ensure_postgres_running() {
  local container_id

  container_id="$(
    cd "$PROJECT_ROOT" || exit 1
    docker compose ps --status running -q postgres
  )" || fail "postgres container status check" "cd \"$PROJECT_ROOT\" && docker compose ps --status running -q postgres"

  if [ -z "$container_id" ]; then
    fail "postgres container availability" "cd \"$PROJECT_ROOT\" && docker compose up -d postgres"
  fi
}

run_seed_sql() {
  (
    cd "$PROJECT_ROOT" || exit 1
    docker compose exec -T postgres psql -X -U postgres -d cuidedopet -v ON_ERROR_STOP=1 -At <<SQL
WITH existing AS (
  SELECT id, email, name
  FROM "User"
  WHERE id = '${QA_USER_ID}'
),
inserted AS (
  INSERT INTO "User" (id, email, name, "createdAt", "updatedAt")
  SELECT '${QA_USER_ID}', '${QA_USER_EMAIL}', '${QA_USER_NAME}', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM inserted) THEN 'CREATED'
  WHEN EXISTS (
    SELECT 1
    FROM existing
    WHERE email = '${QA_USER_EMAIL}'
      AND name IS NOT DISTINCT FROM '${QA_USER_NAME}'
  ) THEN 'ALREADY_EXISTS'
  ELSE 'MISMATCH|' || COALESCE((SELECT email FROM existing), '<null>') || '|' || COALESCE((SELECT name FROM existing), '<null>')
END;
SQL
  )
}

print_step "Checking required commands"
require_command docker

print_step "Checking postgres container"
ensure_postgres_running

print_step "Seeding local QA user"
seed_result="$(run_seed_sql)" || fail "seed local QA user" "cd \"$PROJECT_ROOT\" && docker compose exec -T postgres psql -X -U postgres -d cuidedopet -v ON_ERROR_STOP=1 -At"

case "$seed_result" in
  CREATED)
    printf '\n[OK] QA user created successfully.\n'
    ;;
  ALREADY_EXISTS)
    printf '\n[OK] QA user already exists.\n'
    ;;
  MISMATCH\|*)
    IFS='|' read -r _ current_email current_name <<EOF
$seed_result
EOF
    fail "QA user id already exists with different data (email=$current_email, name=$current_name)" "manual cleanup required in database"
    ;;
  *)
    fail "unexpected seed result: $seed_result" "seed SQL result parsing"
    ;;
esac

printf ' - id: %s\n' "$QA_USER_ID"
printf ' - email: %s\n' "$QA_USER_EMAIL"
printf ' - name: %s\n' "$QA_USER_NAME"