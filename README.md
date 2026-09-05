# PeoplePay360 — Integrated HR & Payroll Operations Platform

PeoplePay360 is a desktop-first HR and payroll operations platform linking employee contracts, working schedules, attendance, leave management, salary configurations, payruns, payslips, and operational reporting.

---

## Workspace Architecture

- `server/`: Node.js / Express backend with MongoDB persistence.
- `client/`: React / Vite desktop-first frontend application.
- `docs/`: Technical specification, PRD, checklist, and API contracts.

---

## Server Setup & Development

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB instance running locally (`mongodb://127.0.0.1:27017/peoplepay360`) or accessible via URI

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Installation

Install dependencies from the workspace root:

```bash
npm install
```

### Running Server

Start the backend server in development mode:

```bash
npm run dev:server
```

Or directly inside the `server/` directory:

```bash
cd server
npm run dev
```

### Running Tests

Run the server test suite:

```bash
npm run test:server
```

Or inside `server/`:

```bash
cd server
npm test
```
