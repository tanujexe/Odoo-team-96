# PeoplePay360 Shared API Contracts

This document specifies the REST API contract between the Node.js/Express Backend (Developer 1) and the React/Vite Frontend (Developer 2). Any modification to endpoint paths, request bodies, or response structures must be updated here.

---

## Standard Response Format

All API endpoints MUST respond using a uniform JSON envelope structure.

### Success Response (`200 OK`, `201 Created`)

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```
*Note: `meta` is optional and included for paginated lists or aggregate summaries.*

### Error Response (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Server Error`)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "fields": {
      "email": "Invalid email format"
    },
    "warnings": []
  }
}
```

---

## 1. System & Health

### `GET /api/health`
- **Access**: Public
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "status": "OK",
      "service": "PeoplePay360 Backend",
      "database": "connected",
      "timestamp": "2026-09-05T14:50:00.000Z"
    }
  }
  ```

---

## 2. Authentication & Self (`/api/auth`)

### `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "user@peoplepay.com",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "user": {
        "id": "66d9b01a1c9d8b0012a4f001",
        "name": "Jane HR Manager",
        "email": "hrmanager@peoplepay.com",
        "role": "HR_MANAGER",
        "employeeId": "66d9b01a1c9d8b0012a4f002",
        "status": "ACTIVE"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses**:
  - `400 INVALID_JSON` / `400 VALIDATION_ERROR`
  - `401 INVALID_CREDENTIALS` (`"Invalid email or password"`)
  - `403 ACCOUNT_INACTIVE` (`"Account is inactive"`)

### `GET /api/auth/me`
- **Access**: Authenticated (Requires `Authorization: Bearer <token>`)
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "user": {
        "id": "66d9b01a1c9d8b0012a4f001",
        "name": "Jane HR Manager",
        "email": "hrmanager@peoplepay.com",
        "role": "HR_MANAGER",
        "employeeId": "66d9b01a1c9d8b0012a4f002",
        "status": "ACTIVE"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 UNAUTHORIZED` / `401 TOKEN_EXPIRED` / `401 INVALID_TOKEN`

---

## 3. Employee & Master Data (`/api/employees`, `/api/schedules`, `/api/contracts`)

### `GET /api/employees`
- **Access**: Authenticated (Role or Ownership constrained)
- **Query Params**: `page`, `pageSize`, `search`, `departmentId`, `employeeType`, `status`
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": "66d9b01a1c9d8b0012a4f002",
        "employeeCode": "EMP001",
        "name": "Jane Employee",
        "email": "jane@peoplepay.com",
        "jobPosition": "Software Engineer",
        "employeeType": "FULL_TIME",
        "status": "ACTIVE"
      }
    ],
    "meta": { "page": 1, "pageSize": 20, "total": 1 }
  }
  ```

### `GET /api/employees/:id`
- **Access**: Owner or HR Manager+
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "employee": { ... },
      "smartCounts": {
        "contracts": 2,
        "attendance": 45,
        "allocations": 1,
        "requests": 3
      }
    }
  }
  ```

### `POST /api/schedules`
- **Access**: HR Manager, HR Payroll Manager, Admin
- **Request Body**:
  ```json
  {
    "name": "Standard 40h Shift",
    "type": "FULL_TIME",
    "days": [
      { "day": "MON", "startTime": "09:00", "endTime": "18:00", "breakMinutes": 60 }
    ]
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "data": {
      "id": "66d9b01a1c9d8b0012a4f010",
      "name": "Standard 40h Shift",
      "weeklyHours": 8.0
    }
  }
  ```

### `GET /api/contracts/resolve`
- **Access**: Authenticated HR Roles / Payroll Engine
- **Query Params**: `employeeId`, `periodStart` (YYYY-MM-DD), `periodEnd` (YYYY-MM-DD)
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "contract": { "id": "66d9b01a1c9d8b0012a4f020", "wage": 5000, "status": "ACTIVE" },
      "warning": null
    }
  }
  ```
- **Ambiguous/Missing Contract Response (`200 OK`)**:
  ```json
  {
    "data": {
      "contract": null,
      "warning": {
        "code": "AMBIGUOUS_CONTRACT",
        "severity": "BLOCKING",
        "employeeId": "66d9b01a1c9d8b0012a4f002",
        "message": "Multiple active contracts (2) overlap payroll period 2026-09-01 to 2026-09-30."
      }
    }
  }
  ```

---

## 4. Attendance & Time Off (`/api/attendance`, `/api/time-off`)

### `POST /api/attendance/check-in`
- **Access**: Employee self-service or HR Roles
- **Success Response (`201 Created`)**:
  ```json
  {
    "data": {
      "id": "66d9b01a1c9d8b0012a4f030",
      "employeeId": "66d9b01a1c9d8b0012a4f002",
      "checkIn": "2026-09-05T08:30:00.000Z",
      "status": "PRESENT"
    }
  }
  ```

### `POST /api/attendance/check-out`
- **Access**: Employee self-service or HR Roles
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "id": "66d9b01a1c9d8b0012a4f030",
      "checkOut": "2026-09-05T17:00:00.000Z",
      "workedHours": 8.5
    }
  }
  ```

### `PATCH /api/attendance/:id/correction`
- **Access**: HR Manager, HR Payroll Manager, Admin ONLY
- **Request Body**:
  ```json
  {
    "checkIn": "2026-09-05T09:00:00.000Z",
    "checkOut": "2026-09-05T18:00:00.000Z",
    "reason": "Forgot badge at check-in"
  }
  ```

### `POST /api/time-off/requests/:id/approve`
- **Access**: HR Manager, HR Payroll Manager, Admin ONLY
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "id": "66d9b01a1c9d8b0012a4f040",
      "status": "APPROVED",
      "duration": 2.0
    }
  }
  ```

### `POST /api/time-off/requests/:id/cancel`
- **Access**: Owner or HR Roles
- **Description**: Cancels approved request and reverses consumed leave allocation idempotently.

---

## 5. Payroll & Salary Configuration (`/api/salary-structures`, `/api/salary-rules`, `/api/payruns`, `/api/payslips`)

*(Documented in PP-09)*

---

## 6. Dashboard & Reports (`/api/dashboard`)

*(Documented in PP-11)*
