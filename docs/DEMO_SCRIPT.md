# PeoplePay360 — Official 5-Minute Demonstration Script

This script guides Developer 1 and Developer 2 through a synchronized, timed 5-minute demonstration of **PeoplePay360** covering all PRD scenarios, RBAC role transitions, HR master data, deterministic salary calculations, blocking warning resolution, PDF generation, and executive analytics.

---

## Pre-Demo Checklist (T-Minus 1 Minute)

1. Ensure Backend is running on `http://localhost:5000` (or local test database seeded via `npm run seed --workspace server`).
2. Ensure Frontend is running on `http://localhost:3000` (`npm run dev --workspace client`).
3. Browser open at `http://localhost:3000/login`.

---

## 5-Minute Timed Demonstration Sequence

### Act 1: Identity, RBAC & HR Master Data (0:00 – 1:00)

- **[0:00 – 0:20] Sign In as HR Payroll Manager:**
  - On the login screen, click the quick-select card for **Sarah Connor** (`HR_PAYROLL_MANAGER`).
  - Click **Sign In to Workspace**.
  - Highlight the clean, responsive layout and role-aware navigation sidebar.

- **[0:20 – 0:45] Employee Workspace & Smart Navigation:**
  - Navigate to **Employees**.
  - Toggle between **List Table View** and **Kanban Card View**.
  - Click **Workspace** on **Alex Rivera (EMP-001)**.
  - Show the **Smart Actions Hub** with real-time record counts linking to contracts, attendance logs, and leave balances.

- **[0:45 – 1:00] Working Schedules & Contract Period Resolver:**
  - Click the **Contracts** smart action to land on **Contracts & Schedules**.
  - Point out the **Working Schedule** where 5-day net shifts automatically compute to `40.0h / week`.
  - Switch to the **Period Contract Resolver** tab. Run a diagnostic test for an employee with overlapping contracts to demonstrate the blocking `AMBIGUOUS_CONTRACT` detection.

---

### Act 2: Attendance & Time-Off Exception Handling (1:00 – 2:00)

- **[1:00 – 1:30] Self-Service Attendance & Exception Detection:**
  - Navigate to **Attendance**.
  - Show the **Self-Service Terminal** indicating current check-in time.
  - Highlight the **Active Attendance Exceptions Card**: Marcus Vance has a missing checkout from yesterday.
  - Click **Correct Record** as HR Manager, enter timestamps with mandatory audit reason (`"Forgot badge during client site visit"`), and submit. Show the entry transition to `CORRECTED` (8.0 hrs).

- **[1:30 – 2:00] Leave Allocations & Idempotent Balance Deductions:**
  - Navigate to **Time Off**.
  - Highlight the visual **Balance Meters** (Paid Time Off, Sick Leave, Unpaid Leave).
  - Open a pending request for Marcus Vance (3 days PTO) and click **Approve**.
  - Point out that the PTO balance immediately updates from `14.0` to `11.0` days.

---

### Act 3: Deterministic Payroll Engine & Wizard (2:00 – 3:30)

- **[2:00 – 2:30] Salary Rules Configuration:**
  - Navigate to **Payroll & Payslips** $\rightarrow$ **Salary Rules & Configuration**.
  - Point out the ordered execution sequence:
    1. `BASIC` (Fixed 100% Contract Base)
    2. `HRA` (Percentage 15% of Base)
    3. `CONV` (Fixed $250 Allowance)
    4. `PF` (Percentage 12% Deduction)
    5. `TAX_ADJ` (Constrained Formula: `(BASIC + HRA) * 0.10`)

- **[2:30 – 3:00] Two-Step Payrun Creation Wizard (BR-07 / BR-08):**
  - Click **New Payrun Wizard**.
  - **Step 1:** Select `September 2026 Regular Payrun` and period dates `2026-09-01` to `2026-09-30`. Emphasize that zero database records exist yet.
  - **Step 2:** Explicitly check eligible employees (**Alex Rivera** and **Sarah Connor**). Attempting to submit with 0 employees is blocked.
  - Click **Create Draft Payrun Batch**.

- **[3:00 – 3:30] Lifecycle Progression & Warning Diagnostics:**
  - Click **Compute Payrun**.
  - Highlight the **Warning Diagnostics Panel** (surfacing non-blocking informational attendance notices).
  - Click **Validate Payrun** $\rightarrow$ status transitions to `VALIDATED`.
  - Click **Mark as Paid** $\rightarrow$ status transitions to `PAID`.

---

### Act 4: Document Delivery & Executive Analytics (3:30 – 4:30)

- **[3:30 – 4:00] Payslip Breakdown & PDF Generation:**
  - Under the paid payrun, click **View Lines** on Alex Rivera's payslip.
  - Show the persisted rule breakdown:
    - Base Wage: `$8,500.00`
    - Gross: `$10,025.00`
    - Deductions: `-$2,070.00`
    - Net Disbursement: `$7,955.00`
  - Click **Download PDF** to demonstrate server-side generated payslip document.
  - Click **Bulk Send Payslips via Email** and show delivery status badges update to `SENT`.

- **[4:00 – 4:30] Executive Dashboard & Live Filters (BR-11):**
  - Return to **Dashboard**.
  - Show live aggregated KPIs: `$14,505.00 Net Paid`, `100% Paid Payslips`, and `98.2% Attendance Coverage`.
  - Switch Department filter from **All Departments** to **Engineering (ENG)** $\rightarrow$ demonstrate that KPIs, net disbursement ($7,955.00), and chart distributions re-aggregate in real time.

---

### Act 5: Role-Based Access Control Verification (4:30 – 5:00)

- **[4:30 – 5:00] Switch to Employee Role:**
  - In the sidebar role switcher, switch role to **Alex Rivera** (`EMPLOYEE`).
  - Demonstrate that management menus (**Employees**, **Contracts**, **Reports**, **Admin**) are instantly hidden from navigation.
  - Show that visiting `/payroll` renders the clean, friendly **Access Restricted** shield page.
  - Conclude demo on how PeoplePay360 enforces complete domain security and financial reproducibility.
