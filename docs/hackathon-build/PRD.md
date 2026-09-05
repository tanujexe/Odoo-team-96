## HR & Payroll Operations Platform PeoplePay360

Detailed Product Requirements Document (PRD)

Purpose: This document converts the supplied hackathon requirements into an implementation-ready specification. It defines product behavior, roles, workflows, business rules, data relationships, validation, API expectations, UI requirements, project structure, and acceptance criteria so a development AI or engineering team can build the system consistently.

Source basis: The requirements in this PRD are grounded in the supplied PeoplePay360 / HR & Payroll problem statement. Implementation details that were not explicitly specified in the source are marked as recommended implementation decisions, not mandatory hackathon requirements.

Document status: Implementation-ready PRD

Primary product: Integrated HR + Attendance + Time Off + Payroll + Reporting platform

Core principle: Employee Contract/Schedule Attendance/Time Off Payrun Payslip Payment/Delivery Dashboard


## 1. Product Definition

Product name: PeoplePay360

Product type: Integrated Human Resource and Payroll Operations Platform

Primary objective: Build a connected operational system rather than independent CRUD pages. Employee records are the central hub, while contracts, working schedules, attendance, time off, salary configuration and payroll are connected through explicit relationships.

## 1.1 Problem

HR and payroll information becomes difficult to manage when employee details, contracts, attendance, leave and salary information are stored separately. Payroll must know which contract applies to a specific period, which schedule governs expected work, which attendance exceptions need attention, which approved leave affects balances, and which salary rules should be executed.

## 1.2 Product outcome

- Centralized employee master data with related operational records.

- Historical contracts with period-aware contract selection.

- Working schedules that calculate weekly hours from daily definitions.

- Attendance with check-in, check-out, worked hours and authorized corrections.

- Time Off types, allocations, requests, approvals/refusals and automatic balance consumption.

- Configurable Salary Structures and ordered Salary Rules.

- Two-step Payrun creation: define scope/period, then explicitly select employees.

- Payslip computation using the applicable contract and selected salary structure.

- Validation warnings before payroll finalization.

- Individual PDF payslips and bulk email delivery.

- Live Payroll Dashboard using actual HR, attendance, leave and payroll records.

## 1.3 Non-goals

- Do not create static mock screens that do not drive real data.

- Do not hardcode salary totals instead of executing configured salary rules.

- Do not treat contracts as a single permanent employee field; historical contracts must be preserved.

- Do not finalize payroll while known critical warnings are unresolved.

- Do not make dashboard charts independent demo data; they must aggregate system records.

## 2. Users, Roles & Permissions

## Employee

View own employee details, attendance and leave balances; create attendance entries and Time Off Requests; no HR administration or payroll access.

## HR Manager

Full CRUD for Employees, Attendance, Contracts, Working Schedules and Time Off; approve/refuse Time Off; no payroll features.

## HR Payroll User


All HR Manager permissions plus Create/Read/Update Payruns and Payslips; read-only Salary Structures and Salary Rules.

## HR Payroll Manager

All HR Payroll User permissions plus full CRUD Payruns, Payslips, Salary Structures and Salary Rules; full HR/payroll configuration control.

## Admin

Full access to all modules/models; user management, role assignment, permission updates and system administration.

Authorization rule: Every protected backend endpoint must enforce role permissions server-side. Frontend hiding of buttons is not a security mechanism.

Employee self-service rule: Employee users must only access their own employee/attendance/time-off records and must never access another employee's payroll or HR administration data.

## 3. Functional Scope & Module Map

The top-level navigation should expose Employees, Contracts, Attendance, Time Off, Payroll and Reports. Administration and configuration screens should be permission-aware.

## Relationship model:

```
Employee
Contracts Salary Structure
Working Schedule
Attendance
Time Off Allocations Time Off Type
Time Off Requests Time Off Type
Payrun
Salary Structure
Payslips
Employee
Applicable Contract
Worked Days
Salary Rule Lines
Dashboard
Aggregates Employees + Contracts + Attendance + Time Off + Payruns + Payslips
```

## 4. Detailed Functional Requirements

## 4.1 Employee Master Management

Views: Kanban, List, Form.

## Employee form must contain:

- Identity information and employee reference/identifier.

- Department.

- Manager.

- Job position.

- Working schedule.

- Employment/active status.

- Navigation or smart actions to Contracts, Attendance, Time Off and Allocations.

List/Kanban behavior: Users should quickly locate employees and open the unified Employee Form.


Smart actions: Clicking a related-record action opens a filtered list containing only records related to the selected employee.

Acceptance criteria: Creating an employee must allow downstream contracts/schedules/attendance/time-off records to link to that employee; related buttons must show correct counts and filtered results.

## 4.2 Contract Management

Contracts are historical employment records linked to employees.

- Store contract start date and end date where applicable.

- Store wage/salary information.

- Store department and position terms.

- Store Salary Structure reference.

- Show contract status and clearly highlight the active/period-applicable contract.

- Preserve previous contracts rather than overwriting them.

- Payroll must select the contract applicable to the selected payroll period.

Critical business rule: For a payroll period, the system must identify the contract whose validity overlaps/applies to that period. The implementation must prevent or flag concurrent active contracts that would make payroll selection ambiguous.

Recommended validation: If more than one contract qualifies for the same employee and payroll period, mark the employee/payslip as a critical warning and block validation until resolved.

## 4.3 Working Schedule

Working schedules define the expected weekly work pattern.

- List view: name, type, weekly hours.

- Form: weekly lines containing Day, Start Time, End Time and Break.

- Weekly hours must be calculated automatically from daily definitions.

- Schedules can be assigned to employees or contracts.

- Attendance and payroll context should be able to use the assigned schedule.

Calculation: For each working day, worked schedule hours = End Time Start Time Break. Weekly hours = sum of all configured working-day hours. Do not require users to manually type the weekly total.

## 4.4 Attendance

Views: global List and Form, plus employee-specific filtered access.

- Record Check In.

- Record Check Out.

- Calculate Worked Hours.

- Expose attendance status and exceptions.

- Allow manual correction only to authorized users.

- Retain corrected records for reporting and dashboard aggregation.

## Attendance interaction

- Employee can create/check in and check out their own attendance entries.

- HR-authorized users can inspect and correct attendance.

- The system should detect missing check-outs as an exception.


- Worked hours should be calculated from timestamps rather than manually entered whenever possible.

- Attendance should remain linked to the employee and usable by reporting/payroll context.

Important product decision: Check-in/check-out is an application action, not an assumption that the employee is physically at an office. If geolocation/device verification is not implemented, the system must not claim that the attendance is location-verified.

## 4.5 Time Off

## 4.5.1 Time Off Types

- Configure unit as days or hours.

- Configure whether allocation is required.

- Configure approval workflow.

- Configure payroll integration behavior.

## 4.5.2 Allocations

- Link allocation to employee and Time Off Type.

- Define allocated quantity and validity period.

- Require approval before allocated availability becomes usable when the configured workflow requires approval.

- Track taken and remaining quantities.

- Show allocation details transparently.

## 4.5.3 Requests

- Request list: Employee, Type, Dates, Duration, Status.

- Request form contains the request details.

- Authorized HR users can approve or refuse.

- Approved requests requiring allocation automatically consume the relevant balance.

- Employee can view own balances and submit own requests.

Balance rule: Remaining balance = approved allocation available for the validity period approved/consumed requests. The system must avoid double deduction if a request is edited, refused, cancelled or re-approved.

## 4.6 Salary Structures

A Salary Structure is a container for an ordered set of Salary Rules.

- List and Form views.

- Show active status.

- Show number of included rules and relevant employee usage.

- Manage included salary rules and execution sequence.

- Payrun selects a Salary Structure, which determines the rule set used during computation.

## 4.7 Salary Rules

Salary Rules define actual payroll computation.

- Fields: Name, Code, Category, Sequence and computation configuration.

- Categories distinguish Basic, Allowances, Gross, Deductions and Net.

- Rules execute in sequence.

- Later rules can depend on earlier computed values.


- Support fixed amounts, percentages and formulas.

- Computed rule lines must appear in the Payslip breakdown.

Recommended computation context: Each rule should receive a calculation context containing employee, applicable contract, payroll period, worked days, attendance/payroll inputs and previously computed rule values. The exact formula language should be safely constrained rather than executing arbitrary server code.

## 4.8 Payrun Creation Wizard

Clicking NEW on Payruns must open a two-step wizard.

## Step 1: Scope

- Select Salary Structure.

- Select payroll period/start and end dates.

- Continue to Step 2 without creating the Payrun.

## Step 2: Employee Selection

- Display eligible employees for the selected context.

- Allow filtering eligible employees.

- Require explicit employee selection.

- Create Payrun only after the user confirms selection.

## Creation rule

The Payrun record is initialized only when the user clicks Create Payrun. It must contain only the selected employees.

The wizard must not create an empty or partially initialized Payrun simply because the user opened Step 1.

## 4.9 Payrun Processing

Payrun is the parent batch for payroll processing for a defined period.

Required actions: Compute Validate Mark Paid Send Payslips.

- Display run name, Salary Structure, period, status and payslip summary.

- Compute creates/recomputes payslips for selected employees.

- Validation checks critical payroll integrity conditions.

- Warnings must surface before finalization.

- Mark Paid changes the run to paid only after validation requirements are satisfied.

- Finalized/paid runs remain available as historical records.

## Payroll warnings

- Missing required employee/bank information where payment requires it.

- Duplicate payslip for the same employee and payroll period.

- Missing/ambiguous applicable contract.

- Missing Salary Structure or Salary Rules.

- Invalid salary rule calculation.

- Other required data inconsistencies.

Duplicate rule: A validated/finalized payroll system must prevent duplicate finalized payslips for the same employee and payroll period unless an explicit correction/replacement mechanism is implemented.

## 4.10 Payslips & Salary Computation


Payslip identification: Employee, Salary Structure, Payrun, Period, Status, Worked Days.

Computation section: Individual rule lines for Basic, Allowances, Deductions, Gross and Net.

Calculation dependency: Payslip computation must use both the Payrun's selected Salary Structure and the employee's applicable contract for the selected period.

## Core computation sequence:

```
1. Load employee.
2. Resolve contract applicable to payroll period.
3. Load Payrun Salary Structure.
4. Load Salary Rules ordered by Sequence.
5. Build calculation context.
6. Execute each rule.
7. Store rule line result + category + sequence.
8. Derive Gross / Deductions / Net from rule results.
9. Store final payslip totals.
10. Attach warnings/errors if any validation failed.
```

Important: The displayed payslip must be reproducible from stored inputs/configuration. Do not only store a final net number.

## 4.11 Payslip PDF & Email Delivery

- Individual Payslip has Print Payslip action.

- PDF must present employee/payroll identification and salary breakdown.

- Payrun has Send Payslips bulk action.

- Bulk sending must target payslips belonging to that Payrun.

- Delivery status should be recorded so failed/sent states can be surfaced.

- Email sending must not silently mark a message as delivered if the provider reports failure.

## 4.12 Payroll Dashboard

Dashboard must aggregate live data from the system.

Filters: Period, Department and Employee Type.

KPI cards: Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health.

Charts: Salary Cost by Department and Monthly Net Salary Trends using historical records.

Operational alerts: Payroll statuses, missing required information, duplicate payslips and contract attention items.

Attendance overview: Present, Late, Absent, Overtime, missing check-outs, manual edits and attendance coverage.

Time Off overview: Approved days, pending requests and leave balances.

Department breakdown: Headcount plus total salary expenditure.

Live-data rule: Changing underlying employees, attendance, time off or payroll records must change dashboard results after refresh/recalculation.

## 5. End-to-End Business Workflows

## 5.1 Employee Onboarding

```
Admin/HR Create Employee Assign Department/Manager/Position
Assign Working Schedule Create Contract Assign Salary Structure
Employee becomes eligible for operations/payroll once required data is valid.
```

## 5.2 Daily Attendance

```
Employee Check In Attendance record created
Employee Check Out Worked Hours calculated
Exception? Surface warning Authorized HR correction if required
```


```
Attendance available to reports/dashboard/payroll context.
```

## 5.3 Leave Allocation to Request

```
HR Configure Time Off Type
Create Allocation Approve Allocation
Employee submits Request Validate balance/policy
HR approves/refuses
If approved + allocation required consume balance
Dashboard/report reflects updated balance.
```

## 5.4 Payroll

```
Payroll User New Payrun
Step 1: Salary Structure + Period
Step 2: Select eligible employees
Create Payrun
Compute Payslips
Resolve warnings
Validate
Mark Paid
Print individual PDFs / Send bulk payslips
Historical Payrun remains available.
```

## 5.5 Payslip Calculation

```
Payrun Period
Applicable Contract
Selected Salary Structure
Ordered Salary Rules
Rule Results
Basic / Allowances / Gross / Deductions / Net
Payslip stored
PDF / email delivery
```

## 6. Status Models

## 6.1 Payrun Status

Recommended state machine:

```
DRAFT COMPUTED VALIDATED PAID
```

The exact labels can be adapted to UI needs, but state transitions must be explicit and controlled.

## 6.2 Payslip Status

Recommended: Draft Computed Validated Paid/Delivered, with Warning/Error indicators where applicable.

## 6.3 Time Off Request Status

Recommended: Draft/Pending Approved OR Refused. If cancellation is supported, cancellation must reverse any consumed allocation safely.

## 6.4 Contract Status

Recommended: Draft/Upcoming Active Expired/Terminated, while preserving historical records.

## 7. Critical Business Rules

- BR-01 Payroll period determines which contract is applicable.

- BR-02 No ambiguous concurrent contracts may silently drive payroll.

- BR-03 Working schedule weekly hours are calculated, not manually trusted.

- BR-04 Approved allocated leave consumes the corresponding balance exactly once.


- BR-05 Salary Rules are configuration-driven and execute by sequence.

- BR-06 Gross and Net values derive from rule results, not hardcoded values.

- BR-07 Payrun employee scope is explicitly selected by the user.

- BR-08 Duplicate payroll for the same employee and period must be detected.

- BR-09 Required employee/payroll data issues must be surfaced before finalization.

- BR-10 Paid/finalized payroll history must remain queryable.

- BR-11 Dashboard metrics come from live records.

- BR-12 Employee self-service access is restricted to the employee's own records.

- BR-13 HR Manager has no payroll administration access.

- BR-14 HR Payroll User cannot modify Salary Structures/Rules.

- BR-15 Only authorized users may manually correct attendance.

- BR-16 All protected operations must be permission-checked on the backend.

## 8. Data Model / Database Specification

The source permits any database technology. The following logical model is recommended so an AI can implement relationships consistently. If MongoDB is used, model these as collections with ObjectId references and indexed fields.

## User

id, name, email, role, employeeId?, status, createdAt, updatedAt

## Employee

id, employeeCode, name, email, phone?, departmentId, managerId?, jobPosition, employeeType, scheduleId?, status, bankDetails?, createdAt, updatedAt

## Department

id, name, code, status

## Contract

id, employeeId, startDate, endDate?, wage, departmentId, position, salaryStructureId, status

## WorkingSchedule

id, name, type, days[{day,startTime,endTime,breakMinutes}], weeklyHours, status

## Attendance

id, employeeId, date, checkIn, checkOut?, workedHours, status, correctionReason?, correctedBy?, createdAt, updatedAt

## TimeOffType

id, name, unit, allocationRequired, approvalWorkflow, payrollIntegration, status

## TimeOffAllocation

id, employeeId, typeId, allocatedAmount, takenAmount, remainingAmount, validFrom, validTo, status

## TimeOffRequest

id, employeeId, typeId, startDate, endDate, duration, status, approvedBy?, approvedAt?, refusalReason?

## SalaryStructure


id, name, code, ruleIds[], active, createdAt, updatedAt

## SalaryRule

id, name, code, category, sequence, computationType, fixedAmount?, percentage?, formula?, active

## Payrun

id, name, salaryStructureId, periodStart, periodEnd, employeeIds[], status, warnings[], totals, createdBy, createdAt, updatedAt

## Payslip

id, payrunId, employeeId, contractId, salaryStructureId, periodStart, periodEnd, workedDays, ruleLines[], gross, deductions, net, status, warnings[], pdfRef?, deliveryStatus?

## AuditLog

id, actorId, action, entityType, entityId, before?, after?, timestamp

## 8.1 Relationship Rules

- Employee 1:N Contracts.

- Employee 1:N Attendance.

- Employee 1:N Time Off Requests.

- Employee 1:N Time Off Allocations.

- Employee/Contract N:1 Working Schedule where configured.

- Contract N:1 Salary Structure.

- Salary Structure 1:N Salary Rules.

- Payrun 1:N Payslips.

- Payslip N:1 Employee and N:1 applicable Contract.

- Time Off Request N:1 Time Off Type.

- Allocation N:1 Time Off Type.

## 9. Backend/API Requirements

Use REST or an equivalent API architecture. Exact framework is not mandated.

## 9.1 Suggested route groups

```
/api/auth
/api/users
/api/employees
/api/contracts
/api/schedules
/api/attendance
/api/time-off/types
/api/time-off/allocations
/api/time-off/requests
/api/salary-structures
/api/salary-rules
/api/payruns
/api/payslips
/api/dashboard
/api/reports
```

## 9.2 API behavior

- Return consistent success/error response structures.


- Validate request payloads server-side.

- Authenticate protected endpoints.

- Authorize every operation based on role and ownership.

- Use pagination for large lists.

- Support filtering by relevant fields.

- Return validation warnings in a machine-readable structure.

- Use transactions or equivalent consistency mechanisms for critical payroll/leave operations where supported by the chosen database.

- Prevent duplicate Payrun/Payslip creation through server-side checks.

- Log important state changes.

## 9.3 Example payroll endpoint behavior

```
POST /api/payruns
Input: salaryStructureId, periodStart, periodEnd, employeeIds[]
Server:
- authenticate user
- authorize payroll permission
- validate dates
- validate structure
- validate selected employees
- create Payrun
- do not calculate final salary yet
POST /api/payruns/:id/compute
- resolve applicable contracts
- execute salary rules
- create/update payslips
- return computed totals + warnings
POST /api/payruns/:id/validate
- re-check critical warnings
- reject if blocking errors remain
- mark validated
POST /api/payruns/:id/pay
- require validated state
- mark paid
```

## 10. Frontend Requirements

## 10.1 Navigation

Top navigation: Employees | Contracts | Attendance | Time Off | Payroll | Reports. Configuration pages should be accessible according to role.

## 10.2 Reusable UI patterns

- List pages with search/filter/sort/pagination.

- Form pages with clear validation messages.

- Status badges.

- Confirmation dialogs for irreversible actions.

- Loading, empty and error states.

- Smart buttons on Employee Form.

- Wizard step indicator for Payrun creation.

- Payroll warning panel before validation.


- Dashboard filter bar.

- Responsive layout suitable for desktop-first hackathon demonstration.

## 10.3 Permission-aware UI

Hide or disable actions users cannot perform, but always enforce permissions in the backend. Employee users should see self-service navigation rather than HR administration screens.

## 11. Recommended Project Folder Structure

The following structure is optimized for a full-stack implementation and clear AI-agent ownership. It can be adapted to the selected framework.

```
peoplepay360/
README.md
.env.example
.gitignore
docker-compose.yml
client/ # Frontend application
server/ # Backend application
```


```
payruns/
payslips/
calculator/
email/
dashboard/
models/
utils/
docs/
DATA_MODEL.md
DEMO_SCRIPT.md
scripts/
seed.*
reset.*
```

## 11.1 Folder ownership rules

- Frontend feature folders contain UI, feature-specific hooks and feature API calls.

- Backend modules contain business logic for that domain.

- Payroll calculator must be isolated from controllers/routes so it can be unit-tested.

- PDF generation must be isolated from salary calculation.

- Email delivery must be isolated from payroll state logic.

- Shared middleware handles authentication, authorization, validation and errors.

- Seed scripts create representative demo data; production logic must not depend on seed-only values.

## 12. Implementation Order for an AI Coding Agent

## Phase 0: Foundation

Create repository structure, environment configuration, frontend/backend startup, database connection, common error handling and README.

## Phase 1: Auth & RBAC

Implement users, roles, authentication and server-side authorization.

## Phase 2: HR Master Data

Build Employees, Departments, Contracts and Working Schedules.

## Phase 3: Attendance

Implement check-in/out, worked hours, statuses, exceptions and authorized corrections.

## Phase 4: Time Off

Implement Types, Allocations, Requests, approval/refusal and balance consumption.

## Phase 5: Salary Configuration

Implement Salary Structures and ordered Salary Rules.


## Phase 6: Payroll Engine

Implement Payrun wizard, eligibility, contract resolution, rule execution and Payslip creation.

## Phase 7: Payroll Operations

Implement Compute, Validate, Mark Paid, warnings, duplicate checks and history.

## Phase 8: Documents & Delivery

Implement Payslip PDF and bulk email delivery.

## Phase 9: Dashboard

Implement live KPIs, charts, alerts and filters.

## Phase 10: QA & Demo

Seed realistic data, test all roles, verify two end-to-end scenarios, polish UI and prepare five-minute walkthrough.

## 13. Testing & Acceptance Criteria

## 13.1 Role tests

- Employee cannot open payroll administration endpoints.

- Employee cannot view another employee's private records.

- HR Manager cannot create/update Payruns or Salary Rules.

- HR Payroll User can manage Payruns/Payslips but cannot modify Salary Structures/Rules.

- HR Payroll Manager can configure salary and payroll.

- Admin can manage all supported records and users.

## 13.2 Payroll tests

- Correct contract is selected for a historical payroll period.

- Expired contract is not incorrectly selected for a later period.

- Ambiguous concurrent contracts create a blocking warning.

- Salary Rules execute in sequence.

- Percentage rules can use prior computed values.

- Gross and Net totals match their configured rule results.

- Duplicate payslip detection works.

- Payrun cannot be marked Paid before validation.

- Paid payroll remains available as history.

## 13.3 Time Off tests

- Allocation approval controls availability where configured.

- Approved request reduces remaining balance.

- Refused request does not consume balance.

- Reprocessing the same approval does not double-deduct.

- Insufficient balance is rejected when allocation is required.

- Validity dates are respected.

## 13.4 Attendance tests


- Check-in creates attendance.

- Check-out calculates worked hours.

- Missing check-out is surfaced.

- Unauthorized user cannot manually correct attendance.

- Corrected records remain traceable.

## 13.5 Dashboard tests

- KPI values are derived from stored records.

- Period filter changes metrics.

- Department filter changes metrics.

- Employee Type filter changes relevant metrics.

- Payroll/attendance/time-off changes are reflected after refresh/recalculation.

## 14. Security, Reliability & Data Integrity

- Passwords must be securely hashed if local authentication is used.

- Use secure session/token handling.

- Validate all user input server-side.

- Prevent unauthorized object access by checking ownership/role.

- Never expose secrets in frontend code.

- Store credentials and provider keys in environment variables.

- Sanitize/validate formulas used by Salary Rules.

- Protect payroll operations against duplicate requests and repeated state transitions.

- Record audit information for critical changes such as contract changes, salary rule changes, attendance corrections and payroll state changes.

- Use consistent error handling without leaking stack traces or secrets.

## 15. Demo / Seed Data Requirements

The system should include representative data so the hackathon demonstration works immediately.

- Multiple departments.

- Employees with different employee types.

- At least one employee with historical and current contracts.

- Working schedules with different weekly patterns.

- Attendance with normal records and exceptions such as missing check-out.

- Time Off Types, approved allocations and requests in different statuses.

- Salary Structure containing Basic, Allowance, Deduction and Net/Gross-related rules.

- At least one payroll period with multiple selected employees.

- At least one warning scenario such as missing bank information or duplicate-payslip detection.

- Historical payroll data for dashboard trend charts.

## 16. Five-Minute Demonstration Flow

Scenario 1: Employee Payslip


```
0:00–0:30 Open Employees show Employee Form and related smart actions.
0:30–1:00 Open Contract + Working Schedule.
1:00–1:30 Show Attendance and a correction/exception.
1:30–2:00 Open Salary Structure + Salary Rules.
2:00–3:00 Create Payrun using two-step wizard select employees Compute.
3:00–3:30 Show warnings Validate Mark Paid.
3:30–4:00 Open Payslip show rule-level Basic/Allowance/Deduction/Gross/Net.
4:00–4:20 Generate PDF demonstrate Send Payslips.
```

*Scenario 2: Leave allocation request*

4:20–4:40 Show Time Off Type + Allocation.

4:40–5:00 Submit/approve request show balance reduction dashboard impact.

Demo principle: Show relationships and business logic, not just individual screens.

## 17. Instructions for the AI Coding Agent

The following rules should be treated as implementation constraints.

- Read this PRD before modifying architecture.

- Do not invent a second payroll model when an existing module already represents the same concept.

- Keep domain logic in services/use-cases rather than UI components.

- Never hardcode salary amounts, dashboard numbers or employee counts for the production UI.

- Implement Salary Rules as real executable configuration using safe, controlled computation methods.

- Keep Payrun creation separate from Payrun computation.

- Resolve the period-applicable Contract before calculating a Payslip.

- Return warnings as structured data so frontend can display them.

- Do not bypass backend authorization because a button is hidden in the frontend.

- Preserve historical records.

- Use IDs/references consistently between related entities.

- Write tests for payroll calculations and leave balance logic before declaring those modules complete.

- When a requirement is ambiguous, prefer the business rules in this PRD and document the decision in code comments/docs instead of silently changing behavior.

- Do not remove required functionality to make implementation easier.

- Do not mark a feature complete if it is only a static mockup.

## Definition of Done

- Feature has UI + API + database persistence where applicable.

- Role permissions are enforced.

- Validation and error states exist.

- Core business rules have automated tests.

- Feature works with seeded data.

- Feature integrates with dependent modules.

- No critical console/server errors remain.

- README explains how to run the feature.

## 18. Future Roadmap

The supplied requirements focus on the core hackathon scope. Potential future extensions can include advanced payroll tax/local compliance, richer analytics, biometric/device integrations, attendance geofencing, employee self-service


mobile experiences, richer notification systems, accounting integration, bank payment automation, audit reporting and multi-company/multi-country payroll. These are not required for the core implementation unless separately added to scope.

## 19. Final Implementation Checklist

- Authentication + RBAC

- Employee Kanban/List/Form

- Employee related smart actions

- Contract history + period applicability

- Working schedule + automatic weekly hours

- Attendance check-in/check-out + worked hours

- Attendance exception + authorized correction

- Time Off Types

- Time Off Allocations + approval

- Time Off Requests + approval/refusal

- Automatic leave balance consumption

- Salary Structures

- Salary Rules + sequence + fixed/percentage/formula computation

- Two-step Payrun wizard

- Explicit employee selection

- Payrun Compute/Validate/Mark Paid/Send

- Payslip rule breakdown

- Duplicate and missing-data warnings

- Payslip PDF

- Bulk email delivery

- Payroll Dashboard + filters

- Historical payroll

- Seed/demo data

- Automated tests for critical business logic

- Five-minute demo flow
