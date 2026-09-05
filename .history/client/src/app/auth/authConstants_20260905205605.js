export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const DEFAULT_USERS = {
  [ROLES.ADMIN]: {
    id: 'usr-admin-1',
    name: 'System Admin',
    email: 'admin@peoplepay.com',
    role: ROLES.ADMIN,
    employeeId: null,
  },
  [ROLES.HR_PAYROLL_MANAGER]: {
    id: 'usr-pm-1',
    name: 'Charlie Payroll Manager',
    email: 'payrollmanager@peoplepay.com',
    role: ROLES.HR_PAYROLL_MANAGER,
    employeeId: 'emp-charlie-1',
  },
  [ROLES.HR_PAYROLL_USER]: {
    id: 'usr-pu-1',
    name: 'Payroll User Account',
    email: 'payrolluser@peoplepay.com',
    role: ROLES.HR_PAYROLL_USER,
    employeeId: 'emp-charlie-1',
  },
  [ROLES.HR_MANAGER]: {
    id: 'usr-hm-1',
    name: 'Jane HR Specialist',
    email: 'hrmanager@peoplepay.com',
    role: ROLES.HR_MANAGER,
    employeeId: 'emp-jane-1',
  },
  [ROLES.EMPLOYEE]: {
    id: 'usr-emp-1',
    name: 'John Developer',
    email: 'employee@peoplepay.com',
    role: ROLES.EMPLOYEE,
    employeeId: 'emp-john-1',
  },
};