# Build Notes

## 2026-09-05 — Technical specification created

- Source: `PRD.md` in the project root.
- Direct-spec pass requested by the participant; no additional discovery interview was performed.
- Default implementation choices: React/Vite + Express/JavaScript + MongoDB/Mongoose, local demo deployment.
- Updated by participant: use MongoDB instead of PostgreSQL/Prisma; the spec now uses Mongoose schemas, MongoDB indexes/aggregation, and Decimal128 money fields.
- Updated by participant: use JavaScript and JSX (not TypeScript); frontend components use `.jsx`, backend modules use `.js`, with optional JSDoc for editor hints.
- Key integrity decisions: decimal money values, transactional payroll/leave operations, request-keyed leave consumption ledger, and blocking warnings for ambiguous contracts or invalid payroll calculations.

## 2026-09-05 — Parallel build checklist created

- Direct checklist pass requested by the participant; no planning interview or deepening round was requested.
- Two-workstream ownership is explicit: Developer 1 owns all server/data/domain work; Developer 2 owns all client/UI/demo work.
- Shared API contracts are isolated to `docs/api-contracts.md` and require a dedicated agreed change, preventing routine cross-stream merge conflicts.
- Checklist uses 13 dependency-gated tasks with test requirements and acceptance criteria for every task.
