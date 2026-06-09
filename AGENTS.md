# AGENTS.md

## Mission

Build the **Cuide do Pet** MVP incrementally, with real validation, low initial cost, and clear technical decisions.

The agent must act like a pragmatic senior engineer:
- prefer small, verifiable changes;
- preserve clarity over cleverness;
- avoid premature abstraction;
- prioritize real working flows over broad unfinished architecture.

---

## Project context

Project: **Cuide do Pet**

Current MVP strategy:
- local-first development
- near-zero cost
- no deploy in the first phase
- build only what is needed for the first working vertical

Current stack:
- Frontend: Next.js + TypeScript
- Backend: NestJS
- Database: PostgreSQL local
- ORM: Prisma
- AI provider: MiniMax API

Current phase priority:
1. local environment working
2. backend healthcheck
3. Prisma setup
4. initial real schema
5. pets module
6. events module
7. expenses module
8. minimal AI integration
9. first vertical flow end-to-end
10. controlled expansion

---

## Non-negotiable rules

### 1) Never hide failures with fallbacks
**Never use fallbacks that hide issues or errors.**

Do not:
- swallow exceptions
- use empty `catch {}`
- silently return fake success
- return default values that make a broken flow look healthy
- invent fallback config for required env vars
- ignore provider/database/API failures
- continue execution as if required dependencies were available when they are not

Bad examples:
- returning `[]` because the database call failed
- returning `{ ok: true }` after an exception
- using `process.env.X || ""` for required secrets
- silently replacing a failed AI call with mock output
- ignoring a failed Prisma query and continuing

Good examples:
- validate required config at startup
- throw explicit errors for missing required values
- log useful technical context
- fail early when a dependency is required
- return honest error states
- surface the real reason a step failed

When something breaks:
- expose the cause clearly
- fail in a controlled way
- suggest the smallest valid fix
- do not mask the problem

If there is a tradeoff between “keeping the app seeming alive” and “showing the real error”, showing the real error wins.

---

### 2) Prefer small, testable changes
Always work in the smallest safe step.

Expected loop:
1. understand the task
2. identify the minimum change
3. implement it
4. validate it
5. stop and report results before widening scope

Do not combine unrelated work into one large change when a smaller validated step is possible.

---

### 3) Do not expand scope unnecessarily
If the task is:
- create `GET /health`
- prepare Prisma
- create pets CRUD
- wire one AI intent

then do not also:
- redesign the architecture
- add advanced auth flows
- add dashboards
- add queue systems
- add generalized abstractions “for the future”

Keep the current stage lean.

---

### 4) Backend validates critical rules
AI interprets.
Backend validates and executes.

Never trust the model alone for critical fields:
- normalized dates
- `pricePerKg`
- pet vs species association
- required fields
- schedule generation
- medication rules
- permissions
- authentication/authorization

The AI may suggest.
The backend must verify.

---

### 5) Fail fast on required configuration
Required configuration must be explicitly validated.

Examples:
- `DATABASE_URL`
- backend `PORT`
- MiniMax API key
- storage URLs if used
- internal service URLs if required

Do not silently default required values.

Required config should either:
- be validated at startup, or
- be validated before first use with a clear thrown error

---

### 6) Simplicity before generalization
Prefer:
- small services
- explicit DTOs
- clear names
- obvious control flow
- direct code over speculative abstractions

Avoid for now:
- unnecessary factories
- dynamic module systems without real need
- generic repositories just for pattern purity
- indirection layers that do not remove real complexity

---

### 7) No “mock-like” behavior in real paths unless explicitly requested
Do not add placeholder success behavior in real runtime code unless the user explicitly asks for mock behavior.

If something is not implemented:
- say it is not implemented
- return a deliberate honest response
- use `TODO` only when appropriate and explicit

Do not fake completion.

---

## Technical implementation guidance

## Backend (NestJS)
- use strict TypeScript
- keep modules focused
- prefer explicit DTO validation
- use controllers only for transport concerns
- keep business rules in services
- centralize shared validation logic when it becomes repeated
- avoid fat controllers
- avoid hiding dependency errors behind generic messages

### NestJS rules
- explicit routes
- explicit status/error behavior
- validate inputs
- keep side effects visible
- if a dependency is unavailable, respond honestly

---

## Database (Prisma + PostgreSQL)
- schema changes must be intentional
- prefer explicit model names aligned with product language
- avoid adding fields “just in case”
- recalculate critical derived values in backend logic
- do not silently recover from broken queries
- surface migration/config errors clearly

### Prisma rules
- keep `schema.prisma` readable
- use migrations intentionally
- avoid hidden data assumptions
- fail clearly if database connection/config is invalid

---

## Frontend (Next.js)
- keep UI simple and functional first
- all important states should be visible:
  - loading
  - empty
  - success
  - error
- never pretend data loaded when it failed
- error states must be honest
- do not mask broken API calls with fake empty screens unless the empty state is truly valid

### Frontend rules
- show clear user feedback
- avoid silent failures
- avoid optimistic UI that hides server failure unless explicitly designed and handled
- keep components small
- use typed props
- prefer server/client boundaries that are easy to understand

---

## AI integration (MiniMax)
The model is used to interpret user intent, not to be the source of truth.

Use AI mainly for:
- `CREATE_EVENT`
- `REGISTER_EXPENSE`
- later: `ASK_HISTORY_QUESTION`
- later: `GENERATE_VET_SUMMARY`

### AI rules
- require structured output
- validate returned fields before executing actions
- never trust the model blindly
- if required fields are missing, ask for confirmation or reject safely
- do not fabricate parsed data to complete an action
- do not hide provider errors with fake AI success

If MiniMax fails:
- surface the provider failure clearly
- do not replace it with fake parsed output unless the user explicitly asked for mock mode

---

## Validation strategy

Every meaningful change should be followed by one validation step.

Examples:
- after creating backend app → run backend
- after adding `/health` → call `/health`
- after Prisma setup → validate schema / migration path
- after pets endpoint → create and read one pet
- after AI intent wiring → test one real input and inspect result

Do not claim success without validation evidence.

---

## Current MVP flows to prioritize

Only prioritize these first:

1. healthcheck
2. create pet
3. create manual event
4. create manual expense
5. AI intent `CREATE_EVENT`
6. AI intent `REGISTER_EXPENSE`

Everything else is secondary for now.

Not priority in the first execution phase:
- document upload
- complex storage integration
- full vet summary
- medication scheduling
- reminders automation
- refined dashboard
- advanced analytics

---

## Expected behavior when proposing changes

When responding, the agent should:
- explain what will change
- explain why it is needed now
- identify assumptions
- mention risks when relevant
- keep the proposal grounded in the current phase

Do not:
- over-explain generic theory
- introduce enterprise patterns without clear need
- recommend broad rewrites when a targeted fix exists

---

## Skill selection rules

Before acting, check whether a project skill applies.

Use one primary skill per task.
Only use a secondary skill if it directly helps the same task.

Most relevant skills for this project now:
- `best-practices`
- `develop-frontend`
- `security-threat-checklist`
- `playwright`
- `playwright-interactive`

Deploy-related skills are not a priority in this phase.

---

## Code style expectations

- strict TypeScript
- clear naming
- no unnecessary `any`
- no dead code
- no comment clutter
- no fake resilience
- no silent fallback for required paths
- no hidden errors

---

## Mandatory diary logging

After each relevant step executed, the agent must record an entry in `DIARIO_PROJETO.md` at the project root.

### When to log

Always log when any of the following occurs:
- a terminal command was executed with a relevant result
- a file was created, modified, or removed
- a technical decision was made
- a problem was found (with or without resolution)
- a validation was performed (success or failure)
- a blocker was identified

### What to log

Add a row to the "Linha do tempo cronológica" table with:
- **Data:** real execution date (format YYYY-MM-DD)
- **Fato registrado:** what was executed or decided, stated objectively
- **Resolução / Impacto:** real outcome — what was unblocked, the error encountered, or what remains pending

Update the "Status atual" section if the state of any component changed.

If a new problem was found, add it to "Problemas encontrados" with:
- objective description
- real impact
- current status (resolved, partially resolved, or open)

### Logging rules

- Log only what actually happened — never invent progress
- If something failed, log the real failure and error — never mask it as success
- Never edit previous diary entries — only append
- Keep the same style and format as existing entries
- Do not summarize or omit executed steps

---
## Assistant startup rule

Any coding assistant working in this repository must, before executing a task:

1. Read `AGENTS.md`
2. Read `skills/SKILLS_QUICK_REFERENCE.md`
3. Read the latest relevant entries in `DIARIO_PROJETO.md`

No implementation should begin before these files are consulted.

After each relevant step:
- append a factual row to `DIARIO_PROJETO.md`
- report real validation results
- do not claim success without evidence

---

## Final directive

When in doubt:
- choose the simpler design
- choose the smaller change
- validate before expanding
- and never hide the real error