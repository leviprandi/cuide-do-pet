# Deterministic AI Contract (Current MVP Phase)

This document formalizes the current deterministic AI behavior implemented in `apps/api/src/ai`.

## Supported intents

1. `CREATE_EVENT`
2. `REGISTER_EXPENSE`
3. `UNKNOWN`

## Intent meaning

### `CREATE_EVENT`
- Meaning: user message indicates creation of an event record.
- Current deterministic format:
  - `event petId=<uuid> type=<TYPE> description="<TEXT>" occurredAt=<ISO_DATE>`

### `REGISTER_EXPENSE`
- Meaning: user message indicates creation of an expense record.
- Current deterministic format:
  - `expense userId=<uuid> item="<TEXT>" category=<TEXT> amount=<NUMBER> purchasedAt=<ISO_DATE> [quantity=<NUMBER>] [unit=<TEXT>]`

### `UNKNOWN`
- Meaning: message does not match supported intent patterns.

## Required and optional fields

### CREATE_EVENT
- Required: `petId`, `type`, `description`, `occurredAt`
- Optional: none

### REGISTER_EXPENSE
- Required: `userId`, `item`, `category`, `amount`, `purchasedAt`
- Optional: `quantity`, `unit`

## Stable response contract

Both `/ai/interpret` and `/ai/handle` return these keys:

1. `intent`
2. `confidence`
3. `entities`
4. `requiresConfirmation`
5. `missingFields`
6. `assistantMessage`
7. `executed`
8. `createdRecord`
9. `executionType` (`created` | `confirmation_required` | `unsupported`)

## Valid input examples

### Event
`event petId=8d2edf6a-e387-4b14-be52-c9ffe9111190 type=VACCINE description="Rabies vaccine applied" occurredAt=2026-03-29T18:30:00.000Z`

### Expense
`expense userId=550e8400-e29b-41d4-a716-446655440000 item="Royal Canin Adult" category=food amount=189.90 purchasedAt=2026-03-30T18:00:00.000Z quantity=15 unit=kg`

## Confirmation-required examples (no persistence)

### Incomplete event
`event petId=8d2edf6a-e387-4b14-be52-c9ffe9111190 type=VACCINE`

Expected:
- `requiresConfirmation: true`
- `missingFields` includes `description`, `occurredAt`
- `executed: false`
- `createdRecord: null`

## Unknown examples

1. `hello there`
2. `what did I spend last month?`

Expected:
- `intent: UNKNOWN`
- `executionType: unsupported`
- `executed: false`
