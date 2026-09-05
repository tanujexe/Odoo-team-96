import { apiClient } from './client';
import { mockEmployees } from './mockData';

export async function fetchEmployees(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/employees${query ? `?${query}` : ''}`);
    return response.data;
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
    return response.data;
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
  try {
    const response = await apiClient('/employees', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const newEmp = {
      id: `emp-${Date.now()}`,
      employeeCode: data.employeeCode || `EMP-00${mockEmployees.length + 1}`,
      firstName: data.firstName,
      lastName: data.lastName,
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
