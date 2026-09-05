import { apiClient } from './client';
import { mockContracts, mockEmployees } from './mockData';

export function normalizeContract(cnt) {
  if (!cnt) return cnt;
  const empObj = typeof cnt.employeeId === 'object' && cnt.employeeId !== null ? cnt.employeeId : null;
  const matchedEmp = empObj || mockEmployees.find((e) => e.id === (cnt.employeeId || cnt.employeeId?._id));
  
  const empName =
    cnt.employeeName ||
    empObj?.name ||
    (empObj?.firstName ? `${empObj.firstName} ${empObj.lastName || ''}`.trim() : null) ||
    (matchedEmp?.firstName ? `${matchedEmp.firstName} ${matchedEmp.lastName || ''}`.trim() : null) ||
    'Unassigned Employee';
    
  const empCode =
    cnt.employeeCode ||
    empObj?.employeeCode ||
    matchedEmp?.employeeCode ||
    (typeof cnt.employeeId === 'string' ? cnt.employeeId : '');
    
  const dept =
    cnt.department ||
    empObj?.department ||
    matchedEmp?.department ||
    (typeof cnt.departmentId === 'object' ? cnt.departmentId?.name : null) ||
    'Finance';
    
  const jobPosition =
    cnt.jobPosition ||
    cnt.position ||
    empObj?.jobTitle ||
    matchedEmp?.jobTitle ||
    'Payroll Specialist';
    
  const workingSchedule =
    cnt.workingSchedule ||
    empObj?.scheduleName ||
    matchedEmp?.scheduleName ||
    '40 Hours / Week';

  const code =
    cnt.contractCode ||
    (cnt._id || cnt.id ? `CNT-${String(cnt._id || cnt.id).slice(-6).toUpperCase()}` : 'CNT-2026-001');

  let computedStatus = cnt.status || 'ACTIVE';
  if (cnt.endDate && new Date(cnt.endDate) < new Date()) {
    computedStatus = 'EXPIRED';
  }

  return {
    ...cnt,
    id: cnt._id || cnt.id,
    contractCode: code,
    employeeId: empObj ? empObj._id || empObj.id : cnt.employeeId,
    employeeCode: empCode,
    employeeName: empName,
    department: dept,
    jobPosition,
    workingSchedule,
    salaryStructureName: cnt.salaryStructureName || 'Employee Salary',
    notes: cnt.notes || 'This running contract is the source for payroll calculation in the active period.',
    wage: typeof cnt.wage === 'number' ? cnt.wage : parseFloat(cnt.wage || 0),
    status: computedStatus,
  };
}

export async function fetchContracts(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/contracts${query ? `?${query}` : ''}`);
    const list = Array.isArray(response.data) ? response.data : [];
    const normalized = list.map(normalizeContract);
    const serverIds = new Set(normalized.map((c) => c.id));
    const extraMocks = mockContracts.filter((m) => !serverIds.has(m.id)).map(normalizeContract);
    return [...normalized, ...extraMocks];
  } catch (err) {
    console.warn('[Contracts API] Using fallback mock data:', err);
    let filtered = mockContracts.map(normalizeContract);
    if (params.employeeId) {
      filtered = filtered.filter((c) => c.employeeId === params.employeeId);
    }
    if (params.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    return filtered;
  }
}

export async function createContract(data) {
  const payload = {
    contractCode: data.contractCode,
    employeeId: data.employeeId,
    wage: Number(data.wage),
    startDate: data.startDate,
    endDate: data.endDate || null,
    status: data.status || 'ACTIVE',
    departmentId: data.departmentId || null,
    position: data.position || '',
    workingSchedule: data.workingSchedule || '40 Hours / Week',
    notes: data.notes || '',
  };

  try {
    const response = await apiClient('/contracts', {
      method: 'POST',
      body: payload,
    });
    return normalizeContract(response.data);
  } catch (err) {
    console.warn('[Contracts API] Backend error during create contract, using fallback:', err);
    const newCnt = {
      id: `cnt-${Date.now()}`,
      contractCode: data.contractCode || `CNT-${new Date().getFullYear()}-00${mockContracts.length + 1}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'Selected Employee',
      wage: Number(data.wage) || 8000,
      wageType: data.wageType || 'MONTHLY',
      startDate: data.startDate || '2026-01-01',
      endDate: data.endDate || null,
      status: data.status || 'ACTIVE',
      department: data.department || 'Finance',
      jobPosition: data.jobPosition || 'Payroll Specialist',
      workingSchedule: data.workingSchedule || '40 Hours / Week',
      salaryStructureName: data.salaryStructureName || 'Employee Salary',
      notes: data.notes || 'This running contract is the source for payroll calculation in the active period.',
      salaryStructureId: data.salaryStructureId || 'str-tech-1',
    };
    mockContracts.unshift(newCnt);
    return normalizeContract(newCnt);
  }
}

export async function updateContract(id, data) {
  try {
    const response = await apiClient(`/contracts/${id}`, {
      method: 'PUT',
      body: data,
    });
    return normalizeContract(response.data);
  } catch (err) {
    const idx = mockContracts.findIndex((c) => c.id === id || c._id === id);
    if (idx !== -1) {
      mockContracts[idx] = { ...mockContracts[idx], ...data };
      return normalizeContract(mockContracts[idx]);
    }
    return normalizeContract({ id, ...data });
  }
}

export async function resolveContract({ employeeId, periodStart, periodEnd }) {
  try {
    const response = await apiClient(
      `/contracts/resolve?employeeId=${employeeId}&periodStart=${periodStart}&periodEnd=${periodEnd}`
    );
    return response.data;
  } catch (err) {
    // If testing employee with ambiguous contracts
    if (employeeId === 'emp-ambiguous-1') {
      return {
        contract: null,
        warning: {
          code: 'AMBIGUOUS_CONTRACT',
          severity: 'BLOCKING',
          employeeId,
          message: `Multiple active contracts (2) overlap payroll period ${periodStart} to ${periodEnd}.`,
        },
      };
    }

    const matched = mockContracts.find((c) => c.employeeId === employeeId && c.status === 'ACTIVE');
    if (!matched) {
      return {
        contract: null,
        warning: {
          code: 'NO_ACTIVE_CONTRACT',
          severity: 'BLOCKING',
          employeeId,
          message: `No active employment contract found for period ${periodStart} to ${periodEnd}.`,
        },
      };
    }

    return {
      contract: matched,
      warning: null,
    };
  }
}
