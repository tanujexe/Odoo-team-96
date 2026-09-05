# PeoplePay360 Parallel Build Checklist

## Build Preferences

- **Build mode:** Parallel autonomous execution by two developers.
- **Verification:** Required at each task gate; do not merge a task without its listed tests.
- **Git:** One branch and pull request per task; rebase before merge; squash merge after the owner approves it.
- **Check-in cadence:** Brief sync after Tasks PP-02, PP-06, PP-10, and PP-12.
- **Merge-safety rule:** Developer 1 owns `server/`; Developer 2 owns `client/`. Shared contracts live in `docs/api-contracts.md` and are changed only in a dedicated PR agreed by both developers. Neither developer edits the other developer's feature directory.

## Workstream Ownership

| Workstream | Owner | Exclusive areas |
| --- | --- | --- |
| Backend, data, domain logic, integration tests | Developer 1 | `server/`, `.env.example`, server scripts, API contract proposals |
| Frontend, UX, client tests, demo materials | Developer 2 | `client/`, `docs/DEMO_SCRIPT.md`, UI screenshots |
| Shared contracts | Both, Developer 1 proposes / Developer 2 approves | `docs/api-contracts.md` only; merge before dependent work begins |

## Checklist

- [x] **PP-01 — Backend foundation and MongoDB connection**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/package.json`, `server/src/app.js`, `server/src/server.js`, `server/src/config/`, `server/src/middleware/`, `server/src/models/`, `.env.example`, `README.md` (server setup section only).
  - **Spec ref:** `spec.md > Stack; File Structure; External APIs And Dependencies`.
  - **Dependencies:** None.
  - **What to build:** Establish Express, Mongoose connection handling, request/error middleware, the common response envelope, health endpoint, test configuration, and the first `docs/api-contracts.md` skeleton.
  - **Acceptance criteria:** Server starts with `MONGODB_URI`; `GET /api/health` returns the standard success envelope; malformed JSON and unhandled errors return the standard error envelope without secrets.
  - **Tests required:** Supertest health/error-envelope tests; Mongoose connection failure test using a bad test URI.
  - **Verify:** `npm test --workspace server` and `npm run dev --workspace server`.

- [x] **PP-02 — Frontend foundation, design system, and route shell**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/package.json`, `client/src/main.jsx`, `client/src/app/`, `client/src/components/`, `client/src/lib/api/`, `client/src/styles/`, `client/src/features/*/index.jsx` route placeholders.
  - **Spec ref:** `spec.md > Stack; Architecture > Frontend; File Structure`.
  - **Dependencies:** None; use a local mock API adapter until PP-01 exposes the health endpoint.
  - **What to build:** Establish Vite/React JSX, React Router, Tailwind, TanStack Query, global layout, role-aware navigation shell, API client/error boundary, reusable table/form/status/confirmation components, and loading/empty/error states.
  - **Acceptance criteria:** App starts, all required top-level routes render within one shared layout, and the UI has responsive loading, empty, and error states without relying on server changes.
  - **Tests required:** Vitest/React Testing Library tests for route rendering, error boundary, status badge, and permission-aware navigation visibility.
  - **Verify:** `npm test --workspace client` and manual browser check at the Vite URL.

- [x] **PP-03 — Identity, authentication, RBAC, and audit foundation**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/src/models/{User,Employee,AuditLog}.js`, `server/src/routes/auth.js`, `server/src/controllers/authController.js`, `server/src/services/authService.js`, `server/src/middleware/{authenticate,authorize,ownership}.js`, `server/src/tests/auth/`.
  - **Spec ref:** `spec.md > Architecture > Authorization model; Data Model`; `PRD.md > 2; BR-12 to BR-16`.
  - **Dependencies:** PP-01.
  - **What to build:** Seedable users, bcrypt login, JWT authentication, role middleware, employee-ownership checks, and audit-write helper. Document exact login/me/error payloads in `docs/api-contracts.md`.
  - **Acceptance criteria:** All five roles are representable; protected APIs reject missing/invalid tokens; employee users cannot access another employee's data or payroll APIs; salary configuration writes reject HR Payroll User.
  - **Tests required:** Role matrix API tests, cross-employee ownership test, password-hash test, audit helper test.
  - **Verify:** `npm test --workspace server -- auth`.

- [ ] **PP-04 — Login and client authorization experience**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/src/features/auth/`, `client/src/app/{router,providers,auth}.jsx`, `client/src/lib/api/auth.js`, `client/src/components/ProtectedRoute.jsx`, `client/src/tests/auth/`.
  - **Spec ref:** `spec.md > Architecture > Frontend; Authorization model`; `PRD.md > 2; 10.3`.
  - **Dependencies:** PP-02; contract review of PP-03's documented auth endpoints.
  - **What to build:** Login page, session bootstrap, token storage, route guard, role-aware navigation/actions, logout behavior, and friendly unauthorized states.
  - **Acceptance criteria:** Users are redirected to login when unauthenticated; each role sees only appropriate navigation/actions; an API 401/403 clears or preserves session appropriately and shows a clear message.
  - **Tests required:** Login success/failure tests, protected route test, role-navigation snapshots/assertions.
  - **Verify:** Run client tests; manually sign in with Employee and HR Payroll Manager seed accounts.

- [x] **PP-05 — HR master-data backend: employees, schedules, and contracts**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/src/models/{Department,Employee,WorkingSchedule,Contract}.js`, `server/src/routes/{employees,schedules,contracts}.js`, matching controllers/services/validators, `server/src/payroll/contractResolver.js`, `server/src/tests/hr/`, `docs/api-contracts.md`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Employee workspace; Contracts and schedules`; `PRD.md > 4.1-4.3; BR-01 to BR-03`.
  - **Dependencies:** PP-01, PP-03.
  - **What to build:** CRUD/filter/pagination endpoints, related-record counts, calculated schedule weekly hours, historical contracts, and a pure resolver that returns one applicable contract or a blocking ambiguity/missing result.
  - **Acceptance criteria:** Employee records link to departments, schedules, and contracts; weekly hours are server-calculated; past contracts remain; zero or multiple applicable contracts never silently select a payroll contract.
  - **Tests required:** Weekly-hour calculation tests; employee CRUD/ownership tests; historical, expired, and concurrent-contract resolver tests.
  - **Verify:** Server HR test suite plus API calls for employee list, schedule create, and period contract lookup.

- [ ] **PP-06 — HR master-data client: employee workspace and schedule/contract screens**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/src/features/{employees,contracts,schedules}/`, `client/src/lib/api/{employees,contracts,schedules}.js`, `client/src/tests/hr/`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Employee workspace; Contracts and schedules`; `PRD.md > 4.1-4.3; 10.2`.
  - **Dependencies:** PP-02; endpoint contracts from PP-05 (UI implementation may start against mocks).
  - **What to build:** Employee list/kanban/form, related-record smart actions, schedule editor with visible calculated weekly total, and contract history/detail screens with status badges.
  - **Acceptance criteria:** HR can create/edit employees, navigate to filtered related records, configure a weekly schedule without typing its total, and view historical/current contracts; employee role cannot access admin views.
  - **Tests required:** Form validation tests, smart-action filtered-navigation test, schedule-total display test, employee-role route guard test.
  - **Verify:** Manual onboarding flow: employee → schedule → contract; run client HR tests.

- [x] **PP-07 — Attendance and time-off backend workflow**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/src/models/{Attendance,TimeOffType,TimeOffAllocation,TimeOffRequest,AllocationConsumption}.js`, `server/src/routes/{attendance,timeOff}.js`, matching controllers/services/validators, `server/src/tests/{attendance,timeOff}/`, `docs/api-contracts.md`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Attendance; Time off`; `PRD.md > 4.4-4.5; BR-04; BR-15`.
  - **Dependencies:** PP-03, PP-05.
  - **What to build:** Self check-in/out, worked-hour calculation, exception/correction auditing, time-off types/allocations/requests, and transaction/session-backed approval/cancellation with a request-keyed consumption ledger.
  - **Acceptance criteria:** Check-out computes worked hours; missing check-out is surfaced; only authorized roles can correct attendance; approved allocated leave consumes balance once; refusal does not consume it; cancellation reverses it once.
  - **Tests required:** Check-in/out and correction authorization tests; allocation validity/insufficient-balance tests; approve/retry/refuse/cancel idempotency tests.
  - **Verify:** Server attendance/time-off suite using a MongoDB replica-set test environment for transaction paths.

- [ ] **PP-08 — Attendance and time-off client workflow**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/src/features/{attendance,time-off}/`, `client/src/lib/api/{attendance,timeOff}.js`, `client/src/tests/{attendance,timeOff}/`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Attendance; Time off`; `PRD.md > 4.4-4.5; 10.2-10.3`.
  - **Dependencies:** PP-02; endpoint contracts from PP-07.
  - **What to build:** Employee check-in/out controls, attendance list and authorized correction form, time-off type/allocation management, request form, approval/refusal actions, and visible leave balances/statuses.
  - **Acceptance criteria:** Employees only see their own attendance/leave data; HR can approve/refuse; balances visibly update after approval; correction controls are hidden/disabled outside authorized roles while the server remains authoritative.
  - **Tests required:** Self-service visibility test, check-in/out mutation state test, leave request validation test, HR approval UI test.
  - **Verify:** Manual leave scenario from allocation to approval and balance refresh; run client feature tests.

- [ ] **PP-09 — Salary configuration and deterministic payroll engine**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/src/models/{SalaryStructure,SalaryRule,Payrun,Payslip}.js`, `server/src/routes/{salaryStructures,salaryRules,payruns,payslips}.js`, `server/src/payroll/{ruleEngine,calculator,warningService,contractResolver}.js`, matching services/validators/tests, `docs/api-contracts.md`.
  - **Spec ref:** `spec.md > Data Flow; Salary rule evaluation; Components And Responsibilities > Salary configuration and calculator; Payroll operations`; `PRD.md > 4.6-4.10; BR-05 to BR-10`.
  - **Dependencies:** PP-03, PP-05, PP-07.
  - **What to build:** Salary structure/rule CRUD, constrained formula evaluator, two-step payrun creation endpoint, compute/recompute, structured warnings, validation, mark-paid state checks, and persisted rule-line snapshots using Decimal128 values.
  - **Acceptance criteria:** Rules execute by sequence; percentage/formula rules can use approved prior values; payrun is not created until selected employees are submitted; ambiguous contracts, duplicate final payroll, bad formulas, and missing required data block validation; paid runs remain historical.
  - **Tests required:** Calculator fixtures; formula rejection tests; payrun scope test; warning/409 validation test; duplicate-finalized-payslip test; state-transition/idempotency tests.
  - **Verify:** `npm test --workspace server -- payroll` and an API-driven clean payrun plus a seeded warning scenario.

- [ ] **PP-10 — Payroll configuration, payrun wizard, and payslip UI**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/src/features/payroll/`, `client/src/lib/api/{salaryStructures,salaryRules,payruns,payslips}.js`, `client/src/components/{PayrunWizard,WarningPanel}.jsx`, `client/src/tests/payroll/`.
  - **Spec ref:** `spec.md > API Contracts > Payrun create contract; Data Flow; Components And Responsibilities > Payroll operations`; `PRD.md > 4.6-4.10; 10.2`.
  - **Dependencies:** PP-02; endpoint contracts from PP-09.
  - **What to build:** Salary structure/rule screens with role-based edit controls; two-step payrun wizard; employee filters/explicit selection; run detail with compute/validate/pay actions; blocking warning panel; persisted payslip breakdown.
  - **Acceptance criteria:** Opening the wizard creates no record; empty selection cannot submit; Payroll User cannot edit salary rules; blocking warnings prevent the validate/pay controls; payslip shows ordered Basic/Allowance/Deduction/Gross/Net rule lines from the API.
  - **Tests required:** Wizard no-submit/explicit-selection tests; role-based salary-rule action test; warning-panel state test; payslip breakdown rendering test.
  - **Verify:** Manual HR Payroll Manager flow through create → compute → resolve warning → validate → paid.

- [ ] **PP-11 — Backend reporting, PDF/email delivery, audit, and demo seed**
  - **Developer:** Developer 1
  - **Files/modules to modify:** `server/src/dashboard/`, `server/src/documents/`, `server/src/routes/{dashboard,reports}.js`, `server/src/services/{payslipDocumentService,dashboardService,auditService}.js`, `server/src/seed/`, `server/src/tests/{dashboard,documents,seed}/`, `docs/api-contracts.md`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Dashboard and reports; External APIs And Dependencies; Demo And Submission Flow`; `PRD.md > 4.11-4.12; 15`.
  - **Dependencies:** PP-07, PP-09.
  - **What to build:** PDF generation from persisted payslip data, delivery adapter/status recording, bulk-send limited to one payrun, dashboard aggregation pipelines/filters, operational alerts, audit records, and idempotent seed data covering demo scenarios.
  - **Acceptance criteria:** PDF contains payslip identity and line breakdown; failed mail is recorded as `FAILED`; dashboard totals/charts change with source records and filters; seed data includes historical contracts, attendance exception, leave workflow, clean payroll, and warning payroll.
  - **Tests required:** PDF content smoke test; mail success/failure tests; dashboard aggregate/filter tests; idempotent seed test.
  - **Verify:** Seed a blank database, generate a payslip PDF, simulate email failure, and call each dashboard filter combination.

- [ ] **PP-12 — Dashboard, document delivery UI, and full client integration**
  - **Developer:** Developer 2
  - **Files/modules to modify:** `client/src/features/reports/`, `client/src/features/payroll/{PayrunDetail,PayslipDetail}.jsx`, `client/src/lib/api/{dashboard,reports}.js`, `client/src/tests/{reports,integration}/`, `docs/DEMO_SCRIPT.md`.
  - **Spec ref:** `spec.md > Components And Responsibilities > Dashboard and reports; Demo And Submission Flow`; `PRD.md > 4.11-4.12; 16`.
  - **Dependencies:** PP-10, PP-11.
  - **What to build:** Dashboard filters, KPIs, charts, alerts, PDF download action, bulk-send feedback, delivery-status UI, and the timed five-minute demo script using seeded records.
  - **Acceptance criteria:** Changing filters changes displayed KPI/chart data; alerts link to the affected record; PDF action downloads/opens the generated document; bulk send reports individual failures; the demo script follows the PRD sequence in five minutes.
  - **Tests required:** Dashboard filter/query-key test; chart/KPI rendering tests; document-delivery state tests; seeded end-to-end browser smoke test.
  - **Verify:** Run the complete seeded demo in a browser and capture submission-ready screenshots.

- [ ] **PP-13 — Integration gate, quality pass, and Devpost handoff**
  - **Developer:** Developer 2 (owner; Developer 1 supplies server test results)
  - **Files/modules to modify:** `README.md` (run/test instructions only), `docs/DEMO_SCRIPT.md`, `docs/DATA_MODEL.md`, `docs/hackathon-build/build-notes.md`, screenshots under `docs/demo-assets/`.
  - **Spec ref:** `spec.md > Risks And Verification; Demo And Submission Flow`; `PRD.md > 13-16; Definition of Done`.
  - **Dependencies:** PP-01 through PP-12.
  - **What to build:** Run the cross-workstream test matrix, confirm API/client contract compatibility, document setup and demo credentials, capture screenshots, and prepare the repository/demo evidence for Devpost submission preparation.
  - **Acceptance criteria:** All server/client tests pass; no role/ownership/payroll/leave regression remains; README runs the project from a clean clone; demo assets demonstrate connected real data rather than mock screens.
  - **Tests required:** Full `npm test` for client and server, seeded browser smoke test for both PRD scenarios, and manual five-role authorization spot check.
  - **Verify:** Clean-clone rehearsal: install, configure `MONGODB_URI`, seed, start both apps, run the five-minute demo, and review the handoff files.

## Merge and Dependency Gates

1. PP-01 and PP-02 start in parallel.
2. PP-03 and PP-04 start after their respective foundations; lock the auth API contract before PP-04 connects to the real API.
3. PP-05/PP-06 and PP-07/PP-08 proceed as paired backend/frontend tracks; the frontend can use mocks until the associated contract is merged.
4. PP-09 must merge before PP-10 uses live payroll endpoints; PP-11 must merge before PP-12 uses live reporting/document endpoints.
5. PP-13 is the only task that updates shared demo documentation after both streams finish.

## Devpost Handoff

After PP-13, gather the repository link, screenshots, five-minute demo steps, test evidence, and product story before continuing to `$prepare-submission`.
