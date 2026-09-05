# PeoplePay360 Technical Specification

## Overview

PeoplePay360 is a desktop-first HR and payroll operations platform. It treats the employee as the central entity and links employment contracts, schedules, attendance, leave, salary configuration, payroll batches, payslips, and operational reporting.

This spec implements the requirements in [PRD.md](../../PRD.md). It favors a conventional JavaScript/JSX web stack, a relational database, and a service-layer payroll engine so the demo is dependable and the financial rules remain testable.

### Scope and priorities

| Priority | Deliverable | PRD reference |
| --- | --- | --- |
| P0 | Auth/RBAC, employees, contracts, schedules, attendance, leave, salary configuration, and a working payrun-to-payslip flow | Sections 2, 4.1-4.10, BR-01 to BR-16 |
| P0 | Blocking payroll warnings, reproducible payslip rule lines, and historical records | Sections 4.9-4.10, 14 |
| P1 | PDF payslip generation, email delivery status, live dashboard, seed data | Sections 4.11-4.12, 15 |
| Out of scope | Tax localization, bank transfers, biometric/geolocation attendance, multi-country payroll | Section 18 |

## Stack

### Application stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React, JSX, Vite, React Router | Fast local iteration and clear module boundaries without a TypeScript build step. |
| UI/data | Tailwind CSS, TanStack Query, React Hook Form, Zod | Consistent responsive UI, cache-aware API reads, and shared form validation. |
| Backend | Node.js, modern JavaScript, Express | Small, familiar REST API with explicit middleware and services. |
| Database | PostgreSQL with Prisma ORM | Transactions, uniqueness constraints, date-range queries, and readable relations suit payroll integrity. |
| Authentication | JWT access token + bcrypt password hashing | Simple hackathon-grade local authentication; roles are checked server-side. |
| Documents | PDFKit | Server-side payslip PDFs without a browser renderer dependency. |
| Email | Nodemailer with Ethereal/dev SMTP fallback | Delivery is isolated and can record sent/failed status. |
| Charts | Recharts | Dashboard charts driven by API aggregates. |
| Tests | Vitest + Supertest | Fast JavaScript service/API tests, especially for payroll and leave invariants. |

Major documentation: [React](https://react.dev/), [Vite](https://vite.dev/guide/), [Express](https://expressjs.com/), [Prisma](https://www.prisma.io/docs), [PostgreSQL](https://www.postgresql.org/docs/), [Zod](https://zod.dev/), [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [PDFKit](https://pdfkit.org/), and [Nodemailer](https://nodemailer.com/).

### Environment

`DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `APP_URL` live in server-side environment configuration. `.env.example` documents names only; secrets are never committed.

## Architecture

### Frontend

The React client has feature routes for Employees, Contracts, Attendance, Time Off, Payroll, Reports, and Administration. A permission-aware navigation layer improves usability, while route guards and API errors handle unauthorized access safely. Feature pages call typed API clients through TanStack Query; mutations invalidate the precise feature and dashboard queries affected.

### Backend API

Express routes validate payloads with Zod, authenticate the request, then authorize both role and employee ownership before calling a domain service. Controllers contain HTTP translation only. Services own transactions and business decisions; repositories/Prisma handle persistence. Use JSDoc annotations where editor hints or runtime contracts need extra clarity; TypeScript is not required.

### Domain services

| Service | Responsibility | PRD reference |
| --- | --- | --- |
| `employeeService` | Employee master data, related-record counts and filtered links | 4.1 |
| `contractService` | Historical contracts and period-applicable contract resolution | 4.2, BR-01/02 |
| `scheduleService` | Daily definitions and calculated weekly hours | 4.3, BR-03 |
| `attendanceService` | Self check-in/out, worked hours, exceptions, authorized corrections | 4.4, BR-15 |
| `timeOffService` | Types, allocations, requests, approval/refusal and idempotent balance changes | 4.5, BR-04 |
| `salaryRuleEngine` | Ordered fixed, percentage, and constrained-formula rule evaluation | 4.6-4.7, BR-05/06 |
| `payrollService` | Payrun creation, warnings, compute, validate, mark paid, and duplicate protection | 4.8-4.10, BR-07/08/09/10 |
| `payslipDocumentService` | PDF rendering and bulk delivery result recording | 4.11 |
| `dashboardService` | Filtered database aggregates; no demo-only figures | 4.12, BR-11 |
| `auditService` | Immutable audit records for sensitive changes | 14 |

### Authorization model

Middleware exposes `actor { userId, role, employeeId? }`. Every protected route uses `requireRole(...)`; self-service routes additionally apply `employeeId = actor.employeeId` server-side, ignoring a client-supplied employee ID. The role matrix follows PRD section 2: Employee is self-service only; HR Manager excludes payroll; HR Payroll User cannot change salary configuration; HR Payroll Manager and Admin have payroll configuration access.

## Data Model

Use the entities and relations defined in PRD section 8. Add the following integrity constraints:

- `User.email` and `Employee.employeeCode` are unique.
- A payslip has a unique composite key `(employeeId, periodStart, periodEnd, payrunId)`; before validation, the service also rejects an overlapping finalized payslip for the same employee.
- `SalaryRule` has a unique `(salaryStructureId, code)` and an ordered `sequence`.
- `Attendance` is unique per `(employeeId, date)` for the MVP daily-record model.
- All amounts use PostgreSQL `numeric(14,2)` / Prisma `Decimal`, never JavaScript floating point.
- Dates are stored as UTC instants; payroll/leave business dates are date-only values interpreted in the configured organization time zone.
- `AuditLog` records actor, action, entity, before/after JSON snapshots, and timestamp.

### State machines

`Payrun: DRAFT -> COMPUTED -> VALIDATED -> PAID`.

`Payslip: DRAFT -> COMPUTED -> VALIDATED -> PAID`, plus independent `deliveryStatus: NOT_SENT | SENT | FAILED`.

`TimeOffRequest: DRAFT -> PENDING -> APPROVED | REFUSED | CANCELLED`. Approval and cancellation run in a transaction and write an allocation-consumption ledger, making a repeated approval a no-op rather than a double deduction.

## File Structure

```text
PeoplePay/
  client/
    src/
      app/                 # Router, providers, auth bootstrap
      components/          # Shared JSX tables, forms, badges, dialogs, warning panels
      features/
        employees/         # Employee list, kanban, form, smart actions
        contracts/         # Contract history and applicable-period views
        attendance/        # Check-in/out and correction UI
        time-off/          # Types, allocations, requests, approvals
        payroll/           # Payrun wizard, run detail, payslip detail
        reports/           # Dashboard filters, KPIs, charts, alerts
        admin/             # Users and role management
      lib/api/             # JavaScript fetch client and endpoint modules
  server/
    src/
      app.js               # Express app/middleware registration
      routes/              # HTTP route definitions per feature (.js)
      controllers/         # Request-to-service translation (.js)
      services/            # Business use cases and transactions (.js)
      payroll/             # Contract resolver, rule engine, warnings, calculator
      documents/           # PDF template and email delivery adapter
      repositories/        # Prisma data access helpers
      middleware/          # Auth, RBAC, ownership, validation, error handling
      validators/          # Zod request schemas
      dashboard/           # Aggregate query builders
      seed/                # Repeatable demo fixture generator
      tests/               # Unit, integration, RBAC, and workflow tests (.test.js)
    prisma/schema.prisma   # Entities, indexes, migrations
  docs/
    DATA_MODEL.md          # ERD/relationship notes
    DEMO_SCRIPT.md         # Five-minute demonstration flow
  README.md                # Setup, scripts, test and demo credentials
  .env.example
```

## API Contracts

All responses use `{ data, meta? }` on success and `{ error: { code, message, fields?, warnings? } }` on failure. List endpoints support `page`, `pageSize`, `search`, and documented feature filters.

### Core routes

| Endpoint | Action | Authorization |
| --- | --- | --- |
| `POST /api/auth/login` | Create access token | Public |
| `GET/POST /api/employees` | List/create employee | HR Manager+; Employee gets self only |
| `GET/PATCH /api/employees/:id` | View/update employee | Owner or HR Manager+ |
| `GET/POST /api/contracts` | Contracts and historical records | HR Manager+ |
| `GET/POST /api/schedules` | Working schedules | HR Manager+ |
| `POST /api/attendance/check-in` | Create own daily attendance | Employee self-service or HR Manager+ |
| `POST /api/attendance/:id/check-out` | Set checkout and worked hours | Owner or HR Manager+ |
| `PATCH /api/attendance/:id/correction` | Correct attendance | HR Manager+ |
| `GET/POST /api/time-off/{types,allocations,requests}` | Time-off resources | Role/ownership constrained |
| `POST /api/time-off/requests/:id/{approve,refuse,cancel}` | Transition leave request | HR Manager+ for approve/refuse; owner cancellation policy |
| `GET/POST /api/salary-structures` | Structure configuration | Read: Payroll User+; write: Payroll Manager/Admin |
| `GET/POST /api/salary-rules` | Rule configuration | Read: Payroll User+; write: Payroll Manager/Admin |
| `POST /api/payruns` | Create selected payrun | Payroll User+ |
| `POST /api/payruns/:id/compute` | Compute/recompute payslips | Payroll User+ |
| `POST /api/payruns/:id/validate` | Validate without blocking warnings | Payroll User+ |
| `POST /api/payruns/:id/pay` | Mark validated run paid | Payroll User+ |
| `POST /api/payruns/:id/send-payslips` | Queue/send only this run's payslips | Payroll User+ |
| `GET /api/dashboard` | Live aggregate data | HR Manager+ or Payroll role |

### Payrun create contract

`POST /api/payruns` body:

```json
{
  "salaryStructureId": "uuid",
  "periodStart": "2026-09-01",
  "periodEnd": "2026-09-30",
  "employeeIds": ["uuid-1", "uuid-2"]
}
```

The frontend wizard holds step-one state locally. No record exists until step two submits non-empty `employeeIds`. The response returns the DRAFT payrun and selected employee count.

`POST /api/payruns/:id/compute` returns `{ payrun, payslips, warnings }`; each warning includes `severity: BLOCKING | WARNING`, `code`, `employeeId?`, and an actionable message. `validate` returns `409` while any `BLOCKING` warning remains.

## Data Flow

### Most important flow: payrun to payslip

1. Payroll user selects a salary structure and inclusive period in the two-step wizard, then explicitly selects eligible employees.
2. `payrollService.createPayrun` validates role, dates, structure, and selections, then creates a DRAFT payrun in one transaction.
3. Compute loads each employee's contract whose dates overlap the period. Zero or multiple matches produce a blocking warning, not a guessed contract.
4. For valid employees, the service loads ordered active rules from the payrun's structure and creates a safe calculation context: contract wage, period days, worked days, approved leave inputs, and prior rule results.
5. The rule engine stores each evaluated rule line and derives gross, deductions, and net from category totals. It persists inputs, resolved contract, rule snapshots, results, totals, and warnings with the payslip.
6. The UI renders persisted payslip lines and warnings. Validate re-runs integrity checks; Mark Paid requires `VALIDATED` with no blocking warnings.
7. PDF generation reads the persisted payslip snapshot. Sending updates each payslip delivery status and writes audit records. Dashboard queries aggregate the same paid payslips, attendance, and approved leave records.

### Salary rule evaluation

Rules support `FIXED`, `PERCENTAGE`, and `FORMULA`. Formula evaluation is not arbitrary JavaScript: parse a small allowlist expression grammar containing numeric literals, arithmetic operators, parentheses, approved input names, and prior rule codes. Reject unknown identifiers, invalid values, divide-by-zero, and non-finite results as blocking calculation warnings. Rule execution uses `sequence` ascending and retains the input/rule snapshot on the payslip for reproducibility.

## Components And Responsibilities

### Employee workspace

Implements: `PRD.md > 4.1`.

Employee list/kanban/form screens manage core records. Smart-action counts come from related-record aggregate endpoints and links include server-enforced employee filters.

### Contracts and schedules

Implements: `PRD.md > 4.2-4.3; BR-01 to BR-03`.

The schedule editor calculates daily net hours as `end - start - breakMinutes` and the server recalculates the weekly total. Contract service validates dates and exposes the selected/ambiguous applicable contract for a payroll period.

### Attendance

Implements: `PRD.md > 4.4; BR-15`.

Self-service actions use server time for check-in/out. Checkout calculates duration; a scheduled job or query marks missing checkouts as exceptions. Corrections require a reason and create an audit entry.

### Time off

Implements: `PRD.md > 4.5; BR-04`.

Approval locks relevant allocation rows, confirms validity and sufficient balance, writes one consumption entry keyed by request ID, then updates the request. Refusal does not consume balance; cancellation reverses one recorded consumption transaction.

### Salary configuration and calculator

Implements: `PRD.md > 4.6-4.7; BR-05/06`.

Configuration pages manage structures and sequenced rules. The calculator is pure and unit-testable; controllers never contain payroll arithmetic.

### Payroll operations

Implements: `PRD.md > 4.8-4.11; BR-07 to BR-10`.

The wizard creates scoped payruns only after confirmation. Run detail presents warnings before state-changing actions. Idempotency keys or transaction-based status checks prevent duplicate compute/pay transitions.

### Dashboard and reports

Implements: `PRD.md > 4.12; BR-11`.

Dashboard filters (`period`, `departmentId`, `employeeType`) are query parameters. KPIs and chart series come from SQL aggregates over real records; each mutation invalidates the dashboard query.

## External APIs And Dependencies

No external HR or banking API is required for the MVP. PostgreSQL is the source of truth. SMTP is optional in local development: use an Ethereal test account or a log-only mail adapter, but always persist `SENT` or `FAILED` based on the adapter result. PDF files are stored locally under a configured server data directory for the demo; production storage is a future adapter boundary.

## AI Usage

AI is not required in the product runtime. Codex may assist with implementation, test generation, and documentation, but all payroll results are deterministic domain logic. This avoids presenting model output as financial calculation.

## Risks And Verification

| Risk | Control | Verification |
| --- | --- | --- |
| Wrong/ambiguous contract | Inclusive overlap query; blocking warning for zero/multiple results | Unit tests for historical, expired, and concurrent contracts |
| Incorrect money totals | Decimal arithmetic and persisted rule-line snapshots | Calculator fixtures for fixed, percentage, formula, gross, and net totals |
| Duplicate payroll | Transaction plus finalized-period duplicate check | Concurrent compute/create integration test |
| Double leave deduction | Request-keyed consumption ledger and transaction | Approve/retry/refuse/cancel test suite |
| Role/ownership leak | Server middleware on every route | Matrix tests for all five roles and cross-employee access |
| Static dashboard | Aggregate queries only; seed data is ordinary records | Change a paid payslip/attendance/request and assert KPI refresh |
| Email falsely reported delivered | Persist provider result per payslip | Mail adapter success and failure tests |

Before demo, run migrations, seed the database, execute unit/integration tests, and manually rehearse the two PRD scenarios. A failed non-critical PDF/email adapter must leave the payroll state valid and visibly show failed delivery.

## Demo And Submission Flow

1. Sign in as HR Payroll Manager; open an employee, contract history, and calculated schedule.
2. Show normal attendance plus a missing-checkout/correction exception.
3. Show an approved leave allocation/request and remaining balance.
4. Open salary structure and ordered salary rules.
5. Create a payrun: choose period/structure, explicitly choose employees, compute it, and surface a deliberately seeded warning.
6. Resolve or use a clean employee, validate, and mark the run paid.
7. Open the persisted payslip breakdown, generate its PDF, and show delivery status.
8. Finish on the dashboard, filtering by department and period to demonstrate that KPIs and charts use live records.

## Build Sequence

1. Foundation: monorepo, database, migrations, error envelope, seed command, and README.
2. Auth/RBAC and role matrix tests.
3. Employee, department, schedules, contracts, and contract resolver.
4. Attendance and time off, including all balance/authorization tests.
5. Salary structures/rules and the isolated calculator test suite.
6. Payrun wizard and compute/validate/pay state transitions.
7. Payslip PDF/email adapter and audit history.
8. Dashboard aggregates, demo fixtures, accessibility/polish, and five-minute rehearsal.

## Open Decisions Recorded as Defaults

- Deployment: run locally for the hackathon demo; deploy only after the local workflow is stable.
- Organization time zone: configure one organization time zone in environment/config rather than attempting multi-country payroll.
- Payroll inputs: use worked days and approved leave as calculation context but do not invent jurisdiction-specific tax rules.
- Banking: bank details are warning-only for the MVP because the application does not initiate transfers.
