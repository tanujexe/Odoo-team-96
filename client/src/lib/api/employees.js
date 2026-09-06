import { apiClient } from './client';
import { mockEmployees, mockContracts } from './mockData';

function normalizeEmployee(emp) {
  if (!emp) return emp;
  const rawName = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).trim() || 'Employee';
  const nameParts = rawName.split(/\s+/);
  const firstName = emp.firstName || nameParts[0] || 'Employee';
  const lastName = emp.lastName !== undefined && emp.lastName !== null && emp.lastName !== ''
    ? emp.lastName
    : (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
  return {
    ...emp,
    id: emp._id || emp.id,
    name: rawName,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    jobTitle: emp.jobTitle || emp.jobPosition || 'Staff',
    department: emp.department || (typeof emp.departmentId === 'object' ? emp.departmentId?.name : 'General'),
    employmentType: emp.employmentType || emp.employeeType || 'FULL_TIME',
  };
}

export async function fetchEmployees(params = {}) {
  let result = [];
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/employees${query ? `?${query}` : ''}`);
    const list = Array.isArray(response.data) ? response.data : [];
    const normalizedList = list.map(normalizeEmployee);
    const serverIds = new Set(normalizedList.map((e) => e.id));
    const extraMocks = mockEmployees.filter((m) => !serverIds.has(m.id)).map(normalizeEmployee);
    result = [...normalizedList, ...extraMocks];
  } catch (err) {
    console.warn('[Employees API] Using fallback mock data:', err);
    result = mockEmployees.map(normalizeEmployee);
  }

  // Client-side search and department filter logic to guarantee real-time reactivity
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.firstName && e.firstName.toLowerCase().includes(q)) ||
        (e.lastName && e.lastName.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.jobTitle && e.jobTitle.toLowerCase().includes(q))
    );
  }

  if (params.departmentId) {
    const depKey = params.departmentId.toLowerCase();
    result = result.filter((e) => {
      if (e.departmentId === params.departmentId) return true;
      const deptName = (e.department || '').toLowerCase();
      if (depKey === 'dept-fin' && deptName.includes('fin')) return true;
      if (depKey === 'dept-hr' && (deptName.includes('hr') || deptName.includes('human') || deptName.includes('people'))) return true;
      if (depKey === 'dept-eng' && (deptName.includes('eng') || deptName.includes('dev') || deptName.includes('tech'))) return true;
      if (depKey === 'dept-ops' && (deptName.includes('op') || deptName.includes('service') || deptName.includes('product'))) return true;
      return false;
    });
  }

  if (params.status) {
    result = result.filter((e) => (e.status || 'ACTIVE').toUpperCase() === params.status.toUpperCase());
  }

  return result;
}

export async function fetchEmployeeById(id) {
  try {
    const response = await apiClient(`/employees/${id}`);
    return {
      ...response.data,
      employee: normalizeEmployee(response.data.employee),
    };
  } catch (err) {
    const rawEmp = mockEmployees.find((e) => e.id === id) || mockEmployees[0];
    const emp = normalizeEmployee(rawEmp);
    const empContracts = mockContracts.filter(
      (c) => c.employeeId === id || c.employeeCode === emp?.employeeCode
    );
    return {
      employee: emp,
      smartCounts: {
        contracts: empContracts.length,
        attendance: 22,
        allocations: 2,
        requests: 1,
        timeOff: 1,
      },
    };
  }
}

export async function createEmployee(data) {
  const isMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  const fullName = (data.name || `${data.firstName || ''} ${data.lastName || ''}`).trim() || 'New Employee';
  const nameParts = fullName.split(/\s+/);
  const firstName = data.firstName || nameParts[0] || 'Employee';
  const lastName = data.lastName !== undefined && data.lastName !== null
    ? data.lastName
    : (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

  const payload = {
    name: fullName,
    firstName,
    lastName,
    email: data.email,
    employeeCode: data.employeeCode,
    jobPosition: data.jobTitle || data.jobPosition || 'Staff',
    employeeType: data.employmentType || data.employeeType || 'FULL_TIME',
    departmentId: isMongoId(data.departmentId) ? data.departmentId : null,
    status: data.status || 'ACTIVE',
    password: data.password,
    role: data.role || 'EMPLOYEE',
    contractCode: data.contractCode,
    wage: data.wage !== undefined ? Number(data.wage) : undefined,
    workingSchedule: data.workingSchedule,
    startDate: data.startDate,
    endDate: data.endDate || null,
    notes: data.notes,
    contractStatus: data.contractStatus,
    bankDetails: {
      accountNumber: data.bankDetails?.accountNumber || data.accountNumber || '',
      bankName: data.bankDetails?.bankName || data.bankName || '',
      ifscCode: data.bankDetails?.ifscCode || data.ifscCode || '',
    },
  };

  try {
    const response = await apiClient('/employees', {
      method: 'POST',
      body: payload,
    });
    return normalizeEmployee(response.data);
  } catch (err) {
    console.warn('[Employees API] Backend error during create employee:', err);
    const newEmp = {
      id: `emp-${Date.now()}`,
      employeeCode: data.employeeCode || `EMP-00${mockEmployees.length + 1}`,
      name: fullName,
      firstName,
      lastName,
      email: data.email,
      jobTitle: data.jobTitle || 'Software Engineer',
      departmentId: data.departmentId || 'dept-eng',
      department: data.department || 'Engineering',
      employmentType: data.employmentType || 'FULL_TIME',
      status: data.status || 'ACTIVE',
      hireDate: data.hireDate || new Date().toISOString().split('T')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    mockEmployees.unshift(newEmp);

    if (data.contractCode || data.wage || data.startDate || data.notes) {
      mockContracts.unshift({
        id: `cnt-${Date.now()}`,
        contractCode: data.contractCode || `CON/2026/00${mockContracts.length + 42}`,
        employeeId: newEmp.id,
        employeeName: fullName,
        employeeCode: newEmp.employeeCode,
        department: newEmp.department,
        jobPosition: newEmp.jobTitle,
        wage: Number(data.wage || 85000),
        wageType: 'MONTHLY',
        workingSchedule: data.workingSchedule || '40 Hours / Week',
        startDate: data.startDate || '2026-01-01',
        endDate: data.endDate || null,
        status: data.contractStatus || 'ACTIVE',
        salaryStructureName: data.salaryStructure || 'Employee Salary',
        notes: data.notes || 'This running contract is the source for payroll calculation in the active period.',
      });
    }

    return newEmp;
  }
}

export async function updateEmployee(id, data) {
  try {
    const response = await apiClient(`/employees/${id}`, {
      method: 'PATCH',
      body: data,
    });
    return response.data;
  } catch (err) {
    const index = mockEmployees.findIndex((e) => e.id === id);
    if (index !== -1) {
      mockEmployees[index] = { ...mockEmployees[index], ...data };
      return mockEmployees[index];
    }
    return { id, ...data };
  }
}
