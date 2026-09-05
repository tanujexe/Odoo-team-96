import { apiClient } from './client';
import { mockContracts } from './mockData';

export async function fetchContracts(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/contracts${query ? `?${query}` : ''}`);
    return response.data;
  } catch (err) {
    console.warn('[Contracts API] Using fallback mock data:', err);
    let filtered = [...mockContracts];
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
    return response.data;
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
    return newCnt;
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
