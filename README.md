# PeoplePay360

PeoplePay360 is an integrated HR and payroll operations platform. It connects employee records, historical contracts, working schedules, attendance, time off, salary configuration, payroll runs, payslips, document delivery, and reporting in one workflow.

The project is built for a local/demo environment with a React/Vite client, an Express API, and MongoDB persistence.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the application](#running-the-application)
- [Demo accounts](#demo-accounts)
- [Application workflows](#application-workflows)
- [Roles and permissions](#roles-and-permissions)
- [API overview](#api-overview)
- [Testing](#testing)
- [Documentation](#documentation)
- [Scope and limitations](#scope-and-limitations)

## Features

### HR operations

- Employee master records with department, position, manager, schedule, status, and bank details.
- Employee list and workspace views with related-record smart actions.
- Historical employment contracts with date-aware payroll contract resolution.
- Working schedules with daily start, end, break, and calculated weekly hours.

### Attendance and time off

- Employee self-service check-in and check-out.
- Worked-hour calculation and missing check-out exception detection.
- Authorized attendance corrections with audit information.
- Time-off types, allocations, requests, approvals, refusals, cancellations, and balance consumption.
- Employee ownership checks so self-service users only access their own records.

### Payroll

- Salary structures with ordered salary rules.
- Fixed, percentage, and constrained formula rule calculations.
- Two-step payrun wizard with explicit employee selection.
- Payrun lifecycle: `DRAFT` -> `COMPUTED` -> `VALIDATED` -> `PAID`.
- Persisted payslip rule lines showing basic pay, allowances, deductions, gross, and net values.
- Blocking payroll warnings for missing or ambiguous contracts and other validation issues.
- Individual PDF payslips and bulk payslip delivery status.

### Reporting and administration

- Dashboard data aggregated from live HR, attendance, leave, and payroll records.
- Role-aware navigation and server-side authorization.
- User and role administration for authorized users.
- Standard JSON response and error envelopes across the API.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 18, JSX, Vite, React Router |
| UI | Tailwind CSS, Lucide React, Framer Motion |
| Client data | TanStack Query, React Hook Form, Zod |
| Backend | Node.js, Express, modern JavaScript |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcryptjs |
| Documents | PDFKit |
| Email | Nodemailer / SMTP or development fallback |
| Testing | Vitest, React Testing Library, Supertest |

## Project structure

```text
PeoplePay/
├── client/
│   ├── src/
│   │   ├── app/              # Router, layout, providers, authentication
│   │   ├── components/       # Shared UI and payroll workflow components
│   │   ├── features/         # HR, attendance, time off, payroll, reports, admin
│   │   ├── lib/api/          # Client API modules and mock data
│   │   ├── pages/            # Standalone pages
│   │   └── tests/            # Client unit and integration tests
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── middleware/        # Authentication, authorization, ownership, errors
│   │   ├── models/            # Mongoose models
│   │   ├── payroll/           # Calculator, rule engine, contract and warnings
│   │   ├── routes/            # REST route definitions
│   │   ├── seed/              # Demo database seed
│   │   ├── services/          # Domain workflows
│   │   └── tests/             # API, domain, and workflow tests
│   └── package.json
├── docs/                      # Product, API, build, and demo documentation
├── .env.example               # Environment variable template
└── package.json               # Workspace scripts
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- MongoDB 6 or newer, running locally or available through a connection URI

MongoDB must be reachable before starting the server or running the seed command.

## Installation

From the repository root:

```bash
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Update `MONGODB_URI` if MongoDB is not using the default local database.

## Configuration

The server loads `.env` from the repository root or from `server/.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Runtime environment |
| `APP_URL` | `http://localhost:5000` | Server application URL |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/peoplepay360` | MongoDB connection string |
| `JWT_SECRET` | Development fallback | JWT signing secret; replace in production |
| `JWT_EXPIRES_IN` | `1d` | JWT lifetime |
| `SMTP_HOST` | `smtp.ethereal.email` | SMTP host for payslip delivery |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | Empty | SMTP username |
| `SMTP_PASS` | Empty | SMTP password |

Do not commit `.env` or real credentials. Use a strong `JWT_SECRET` outside local development.

## Running the application

Start both applications from the repository root:

```bash
npm run dev
```

The services are available at:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

To run each service separately:

```bash
npm run dev:server
npm run dev:client
```

To run the production-style server or preview the built client:

```bash
npm run start --workspace server
npm run build --workspace client
npm run preview --workspace client
```

### Seed demo data

```bash
npm run seed
```

The seed script clears the PeoplePay360 collections and recreates departments, schedules, employees, users, contracts, salary structures, salary rules, attendance, time-off records, payruns, and payslips. Use it only against a development/demo database.

## Demo accounts

All seeded accounts use the password `Password123!`.

| Email | Role | Purpose |
| --- | --- | --- |
| `employee@peoplepay.com` | Employee | Self-service attendance and time off |
| `hrmanager@peoplepay.com` | HR Manager | Employee, contract, schedule, attendance, and leave operations |
| `payrolluser@peoplepay.com` | HR Payroll User | Read salary configuration and operate payroll |
| `payrollmanager@peoplepay.com` | HR Payroll Manager | Full HR and payroll configuration |
| `admin@peoplepay.com` | Admin | Full system administration |

## Application workflows

### Employee onboarding

1. Create an employee and assign a department and working schedule.
2. Configure the schedule's daily working times; weekly hours are calculated.
3. Create one or more historical contracts for the employee.
4. Assign the applicable salary structure to the current contract.

### Attendance and leave

1. An employee checks in and checks out through the Attendance area.
2. The server calculates worked hours from the timestamps.
3. Authorized HR users correct exceptions with an audit reason.
4. An employee submits a time-off request against an allocation.
5. HR approves or refuses it; approved requests consume the allocation once.

### Payroll

1. Configure a salary structure and ordered rules.
2. Create a payrun by selecting the salary structure, period, and employees.
3. Compute payslips using the contract applicable to the payroll period.
4. Resolve blocking warnings before validation.
5. Validate the payrun, mark it paid, download PDFs, or send payslips.

## Roles and permissions

| Role | Main access |
| --- | --- |
| Employee | Own employee, attendance, and time-off records |
| HR Manager | Employees, contracts, schedules, attendance, and time off |
| HR Payroll User | HR Manager access plus payruns and payslips; salary configuration is read-only |
| HR Payroll Manager | Full HR and payroll operations, including salary structures and rules |
| Admin | Full application and user administration |

Authorization is enforced on the backend. Hiding a frontend button is only a usability feature and is not treated as a security boundary.

## API overview

All successful responses use `{ data, meta? }`. Errors use `{ error: { code, message, fields?, warnings? } }`.

| Resource | Base path | Examples |
| --- | --- | --- |
| Health | `/api` | `GET /api/health` |
| Authentication | `/api/auth` | `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `/api/users` | User and role administration |
| Employees | `/api/employees` | Employee CRUD and related counts |
| Schedules | `/api/schedules` | Working schedule CRUD |
| Contracts | `/api/contracts` | Historical contracts and period resolution |
| Attendance | `/api/attendance` | Check-in, check-out, correction, and queries |
| Time off | `/api/time-off` | Types, allocations, requests, and transitions |
| Salary structures | `/api/salary-structures` | Salary structure configuration |
| Salary rules | `/api/salary-rules` | Ordered rule configuration |
| Payruns | `/api/payruns` | Create, compute, validate, pay, and send |
| Payslips | `/api/payslips` | Payslip details, compute, pay, and PDFs |
| Dashboard | `/api/dashboard` | Live KPI and reporting aggregates |

Protected requests use:

```http
Authorization: Bearer <jwt-token>
```

The complete request and response contract is documented in [docs/api-contracts.md](docs/api-contracts.md).

## Testing

Run the complete client and server suites:

```bash
npm run test:server
npm run test:client
```

Useful focused commands:

```bash
npm test --workspace server -- payroll
npm test --workspace client -- src/tests/payroll
npm run build --workspace client
```

Server integration tests may require a MongoDB test database. Keep test and demo databases separate.

## Documentation

- [Product requirements](docs/hackathon-build/PRD.md)
- [Technical specification](docs/hackathon-build/spec.md)
- [Build checklist](docs/hackathon-build/checklist.md)
- [API contracts](docs/api-contracts.md)
- [Five-minute demo script](docs/DEMO_SCRIPT.md)
- [Build notes](docs/hackathon-build/build-notes.md)

## Scope and limitations

PeoplePay360 is a local/demo-ready operations platform. The current scope does not include tax localization, bank transfer execution, biometric or geolocation attendance verification, or multi-country payroll. SMTP delivery requires valid SMTP credentials; without them, development delivery behavior should be treated as a simulation/logging path.

For production use, configure a managed MongoDB deployment, rotate the JWT secret, use secure secret storage, configure a real email provider, enable HTTPS, and review all authorization and audit policies.
