# Cuide do Pet — Copilot Instructions

You are working on the "Cuide do Pet" project.

Before making any code change, silently read:
- `AGENTS.md`
- `skills/SKILLS_QUICK_REFERENCE.md`
- the most recent relevant entries in `DIARIO_PROJETO.md`

Primary working rules:
- Make the smallest safe change possible.
- Do not expand scope unnecessarily.
- Never hide failures with fallbacks, fake data, silent catch blocks, or fake success.
- Keep frontend contracts aligned exactly with the validated backend.
- Backend is the source of truth for critical rules.
- Do not integrate MiniMax yet unless explicitly requested for the current task.
- Do not add new intents unless explicitly requested.
- Prefer explicit, testable, incremental changes.

Frontend-specific rules:
- Keep UI simple and functional first.
- Show honest loading, empty, success, and error states.
- Do not mask backend failures.
- Do not introduce Tailwind, Shadcn, TanStack Query, or other libraries unless explicitly requested for the current step.

Mandatory project logging:
- After every relevant implementation step, append a factual new row to `DIARIO_PROJETO.md`.
- Never rewrite previous diary entries.
- Log only what actually changed and what was actually validated.

Validation rule:
- Do not claim success without at least one real validation step appropriate to the task.

Response style:
- First state what will be changed.
- Then implement only the requested scope.
- Then report:
  1. files changed
  2. validation result
  3. exact diary entry appended