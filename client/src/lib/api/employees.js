import { apiClient } from './client';
import { mockEmployees } from './mockData';

function normalizeEmployee(emp) {
  if (!emp) return emp;
  const nameParts = (emp.name || '').split(' ');
  return {
    ...emp,
    id: emp._id || emp.id,
    firstName: emp.firstName || nameParts[0] || 'Employee',
    lastName: emp.lastName || nameParts.slice(1).join(' ') || '',
    jobTitle: emp.jobTitle || emp.jobPosition || 'Staff',
    department: emp.department || (typeof emp.departmentId === 'object' ? emp.departmentId?.name : 'General'),
    employmentType: emp.employmentType || emp.employeeType || 'FULL_TIME',
  };
}

export async function fetchEmployees(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/employees${query ? `?${query}` : ''}`);
    const list = Array.isArray(response.data) ? response.data : [];
    const normalizedList = list.map(normalizeEmployee);
    const serverIds = new Set(normalizedList.map((e) => e.id));
    const extraMocks = mockEmployees.filter((m) => !serverIds.has(m.id));
    return [...normalizedList, ...extraMocks];
  } catch (err) {
    console.warn('[Employees API] Using fallback mock data:', err);
    let filtered = [...mockEmployees];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    if (params.departmentId) {
      filtered = filtered.filter((e) => e.departmentId === params.departmentId);
    }
    if (params.status) {
      filtered = filtered.filter((e) => e.status === params.status);
    }
    return filtered;
  }
}

export async function fetchEmployeeById(id) {
  try {
    const response = await apiClient(`/employees/${id}`);
    return {
      ...response.data,
      employee: normalizeEmployee(response.data.employee),
    };
  } catch (err) {
    const emp = mockEmployees.find((e) => e.id === id) || mockEmployees[0];
    return {
      employee: emp,
      smartCounts: {
        contracts: 2,
        attendance: 22,
        allocations: 2,
        requests: 1,
      },
    };
  }
}

export async function createEmployee(data) {
  const isMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'New Employee';
  const payload = {
    name: fullName,
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
      firstName: data.firstName || fullName.split(' ')[0],
      lastName: data.lastName || fullName.split(' ').slice(1).join(' '),
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
