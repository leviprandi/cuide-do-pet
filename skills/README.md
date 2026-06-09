# Skills README

This directory contains reusable skills that guide implementation, review, debugging, validation, security checks, and deployment decisions.

These skills are support tools for the agent. They do not replace project rules from the root `AGENTS.md`.

---

## Core usage rules

1. Choose one primary skill per task.
2. Use a second skill only if it directly supports the same task.
3. Read the skill's `When to use` section before applying it.
4. Prefer the skill that best matches the current task, not the most general one.
5. Never use fallbacks that hide issues or errors.

---

## Current project priorities

This project is in an early MVP local-first phase.

Priority order:
1. local environment working
2. healthcheck
3. Prisma setup
4. initial schema
5. pets
6. events
7. expenses
8. minimal AI integration
9. first end-to-end vertical

Because of that, the most useful skills right now are usually:

- `best-practices`
- `develop-frontend`
- `security-threat-checklist`
- `playwright`
- `playwright-interactive`

Deploy skills should only be used later when deployment actually becomes necessary.

---

## Skill selection hints

### Use `best-practices` when
- implementing backend or frontend features
- refactoring
- reviewing architecture
- improving code quality
- defining structure, boundaries, or technical discipline

### Use `develop-frontend` when
- improving layout
- fixing UI bugs
- handling states like loading/empty/error
- improving responsiveness or consistency

### Use `security-threat-checklist` when
- touching auth
- handling secrets or env vars
- exposing public endpoints
- integrating external providers
- changing permission-sensitive logic

### Use `playwright` or `playwright-interactive` when
- validating browser flows
- checking real UI behavior
- debugging interaction issues

### Use deploy-related skills only when
- the project is actually entering deployment/setup work

## Execution diary

The agent must maintain a file named `DIARIO_PROJETO.md` at the repository root.

Rules:
- record only facts that were actually executed or explicitly decided
- record errors encountered and how they were resolved
- record important architecture, scope, and implementation decisions
- update the diary whenever a relevant step is completed
- never invent progress
- never omit important failures
- keep entries objective, chronological, and traceable
- never use fallbacks that hide issues or errors in the diary

---

## Project-wide guardrails

All skills used in this project must respect these rules:

- do not hide real errors
- do not silently recover from critical failures
- do not fake working behavior in real runtime paths
- do not expand scope beyond the current phase
- prefer small validated steps
- keep implementation explicit and testable

If a skill suggests a pattern that conflicts with the project phase, follow the project phase first.

---

## Notes

The full skill catalog is maintained separately.
Use this file as a quick operational guide for agents working inside this repository.