# Build Notes

## 2026-09-05 — Technical specification created

- Source: `PRD.md` in the project root.
- Direct-spec pass requested by the participant; no additional discovery interview was performed.
- Default implementation choices: React/Vite + Express/JavaScript + MongoDB/Mongoose, local demo deployment.
- Updated by participant: use MongoDB instead of PostgreSQL/Prisma; the spec now uses Mongoose schemas, MongoDB indexes/aggregation, and Decimal128 money fields.
- Updated by participant: use JavaScript and JSX (not TypeScript); frontend components use `.jsx`, backend modules use `.js`, with optional JSDoc for editor hints.
- Key integrity decisions: decimal money values, transactional payroll/leave operations, request-keyed leave consumption ledger, and blocking warnings for ambiguous contracts or invalid payroll calculations.
