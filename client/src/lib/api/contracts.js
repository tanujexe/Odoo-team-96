import { apiClient } from './client';
import { mockContracts } from './mockData';

export function normalizeContract(cnt) {
  if (!cnt) return cnt;
  const empObj = typeof cnt.employeeId === 'object' && cnt.employeeId !== null ? cnt.employeeId : null;
  const empName =
    cnt.employeeName ||
    empObj?.name ||
    (empObj?.firstName ? `${empObj.firstName} ${empObj.lastName || ''}`.trim() : null) ||
    'Unassigned Employee';
  const empCode = empObj?.employeeCode || (typeof cnt.employeeId === 'string' ? cnt.employeeId : '');
  const code =
    cnt.contractCode ||
    (cnt._id || cnt.id ? `CNT-${String(cnt._id || cnt.id).slice(-6).toUpperCase()}` : 'CNT-2026-001');

  return {
    ...cnt,
    id: cnt._id || cnt.id,
    contractCode: code,
    employeeId: empObj ? empObj._id || empObj.id : cnt.employeeId,
    employeeCode: empCode,
    employeeName: empName,
    wage: typeof cnt.wage === 'number' ? cnt.wage : parseFloat(cnt.wage || 0),
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
  try {
    const response = await apiClient('/contracts', {
      method: 'POST',
      body: data,
    });
    return normalizeContract(response.data);
  } catch (err) {
    const newCnt = {
      id: `cnt-${Date.now()}`,
      contractCode: data.contractCode || `CNT-${new Date().getFullYear()}-00${mockContracts.length + 1}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'Selected Employee',
      wage: Number(data.wage) || 6000,
      wageType: data.wageType || 'MONTHLY',
      startDate: data.startDate || '2026-01-01',
      endDate: data.endDate || null,
      status: data.status || 'ACTIVE',
      salaryStructureId: data.salaryStructureId || 'str-tech-1',
    };
    mockContracts.unshift(newCnt);
    return normalizeContract(newCnt);
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
