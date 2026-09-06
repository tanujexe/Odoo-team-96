import { apiClient } from './client';
import { mockPayruns } from './mockData';

export let mockPayslips = [
  {
    id: 'ps-1',
    _id: 'ps-1',
    payrunId: 'pr-2026-09',
    employeeId: 'emp-alex-1',
    employeeName: 'Alex Rivera',
    employeeCode: 'EMP-002',
    department: 'Engineering',
    baseWage: 8500,
    gross: 8500,
    deductions: 1700,
    net: 6800,
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    deliveryStatus: 'NOT_SENT',
    status: 'COMPUTED',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', rate: '50%', amount: 4250 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALW', rate: '30%', amount: 2550 },
      { code: 'PF', name: 'Provident Fund', category: 'DED', rate: '12%', amount: 1020 },
      { code: 'TAX', name: 'Income Tax (TDS)', category: 'DED', rate: '8%', amount: 680 },
    ],
  },
  {
    id: 'ps-2',
    _id: 'ps-2',
    payrunId: 'pr-2026-09',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    employeeCode: 'EMP001',
    department: 'Engineering',
    baseWage: 10000,
    gross: 10000,
    deductions: 2000,
    net: 8000,
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    deliveryStatus: 'SENT',
    status: 'COMPUTED',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', rate: '50%', amount: 5000 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALW', rate: '30%', amount: 3000 },
      { code: 'PF', name: 'Provident Fund', category: 'DED', rate: '12%', amount: 1200 },
      { code: 'TAX', name: 'Income Tax (TDS)', category: 'DED', rate: '8%', amount: 800 },
    ],
  },
  {
    id: 'ps-3',
    _id: 'ps-3',
    payrunId: 'pr-2026-09',
    employeeId: 'emp-sarah-1',
    employeeName: 'Sarah Connor',
    employeeCode: 'EMP-003',
    department: 'Finance & Payroll',
    baseWage: 7200,
    gross: 7200,
    deductions: 1440,
    net: 5760,
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    deliveryStatus: 'NOT_SENT',
    status: 'COMPUTED',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', rate: '50%', amount: 3600 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALW', rate: '30%', amount: 2160 },
      { code: 'PF', name: 'Provident Fund', category: 'DED', rate: '12%', amount: 864 },
      { code: 'TAX', name: 'Income Tax (TDS)', category: 'DED', rate: '8%', amount: 576 },
    ],
  },
];

export let mockSalaryStructures = [
  {
    id: 'str-reg-1',
    _id: 'str-reg-1',
    name: 'Regular Salary',
    code: 'REG_SAL',
    ruleCount: 12,
    employeeCount: 42,
    active: true,
  },
  {
    id: 'str-intern-1',
    _id: 'str-intern-1',
    name: 'Intern Salary',
    code: 'INT_SAL',
    ruleCount: 8,
    employeeCount: 6,
    active: true,
  },
  {
    id: 'str-contractor-1',
    _id: 'str-contractor-1',
    name: 'Contractor',
    code: 'CONTR',
    ruleCount: 6,
    employeeCount: 9,
    active: true,
  },
];

export let mockSalaryRules = [
  // Regular Salary Structure Rules (12 sequenced rules from Image 2 & 3)
  {
    id: 'rul-reg-1',
    _id: 'rul-reg-1',
    salaryStructureId: 'str-reg-1',
    code: 'BASIC',
    name: 'Basic Salary',
    category: 'BASIC',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 1,
    percentage: 50.0,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-2',
    _id: 'rul-reg-2',
    salaryStructureId: 'str-reg-1',
    code: 'HRA',
    name: 'House Rent Allowance',
    category: 'ALW',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 10,
    percentage: 20.0,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-3',
    _id: 'rul-reg-3',
    salaryStructureId: 'str-reg-1',
    code: 'STI',
    name: 'Standard Allowance',
    category: 'ALW',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 20,
    percentage: 0,
    quantity: 1,
    fixedAmount: 200,
    amount: 200,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-4',
    _id: 'rul-reg-4',
    salaryStructureId: 'str-reg-1',
    code: 'BONUS',
    name: 'Performance Bonus',
    category: 'ALW',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 30,
    percentage: 0,
    quantity: 1,
    fixedAmount: 500,
    amount: 500,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-5',
    _id: 'rul-reg-5',
    salaryStructureId: 'str-reg-1',
    code: 'LTA',
    name: 'Leave Travel Allowance',
    category: 'ALW',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 40,
    percentage: 0,
    quantity: 1,
    fixedAmount: 150,
    amount: 150,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-6',
    _id: 'rul-reg-6',
    salaryStructureId: 'str-reg-1',
    code: 'FIX',
    name: 'Fixed Allowance',
    category: 'ALW',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 50,
    percentage: 0,
    quantity: 1,
    fixedAmount: 100,
    amount: 100,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-7',
    _id: 'rul-reg-7',
    salaryStructureId: 'str-reg-1',
    code: 'GROSS',
    name: 'Gross Salary',
    category: 'GROSS',
    computationType: 'FORMULA',
    calculationType: 'FORMULA',
    sequence: 60,
    percentage: 0,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: 'BASIC + HRA + STI + BONUS + LTA + FIX',
    active: true,
  },
  {
    id: 'rul-reg-8',
    _id: 'rul-reg-8',
    salaryStructureId: 'str-reg-1',
    code: 'LWF',
    name: 'LWF fund',
    category: 'DED',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 70,
    percentage: 0,
    quantity: 1,
    fixedAmount: 10,
    amount: 10,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-9',
    _id: 'rul-reg-9',
    salaryStructureId: 'str-reg-1',
    code: 'PF',
    name: 'Provident Fund',
    category: 'DED',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 80,
    percentage: 12.0,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-10',
    _id: 'rul-reg-10',
    salaryStructureId: 'str-reg-1',
    code: 'ESIC',
    name: 'ESIC',
    category: 'DED',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 90,
    percentage: 0.75,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-11',
    _id: 'rul-reg-11',
    salaryStructureId: 'str-reg-1',
    code: 'PT',
    name: 'Professional Tax',
    category: 'DED',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 100,
    percentage: 0,
    quantity: 1,
    fixedAmount: 200,
    amount: 200,
    formula: '',
    active: true,
  },
  {
    id: 'rul-reg-12',
    _id: 'rul-reg-12',
    salaryStructureId: 'str-reg-1',
    code: 'NET',
    name: 'Net Salary',
    category: 'NET',
    computationType: 'FORMULA',
    calculationType: 'FORMULA',
    sequence: 110,
    percentage: 0,
    quantity: 1,
    fixedAmount: 0,
    amount: 0,
    formula: 'GROSS - LWF - PF - ESIC - PT',
    active: true,
  },

  // Intern Salary Rules
  {
    id: 'rul-int-1',
    _id: 'rul-int-1',
    salaryStructureId: 'str-intern-1',
    code: 'STIPEND',
    name: 'Intern Monthly Stipend',
    category: 'BASIC',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 1,
    percentage: 100,
    quantity: 1,
    fixedAmount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-int-2',
    _id: 'rul-int-2',
    salaryStructureId: 'str-intern-1',
    code: 'INT_BOOK',
    name: 'Learning Allowance',
    category: 'ALW',
    computationType: 'FIXED',
    calculationType: 'FIXED',
    sequence: 10,
    percentage: 0,
    quantity: 1,
    fixedAmount: 150,
    formula: '',
    active: true,
  },
  {
    id: 'rul-int-3',
    _id: 'rul-int-3',
    salaryStructureId: 'str-intern-1',
    code: 'GROSS',
    name: 'Gross Stipend',
    category: 'GROSS',
    computationType: 'FORMULA',
    calculationType: 'FORMULA',
    sequence: 20,
    percentage: 0,
    quantity: 1,
    fixedAmount: 0,
    formula: 'STIPEND + INT_BOOK',
    active: true,
  },
  {
    id: 'rul-int-4',
    _id: 'rul-int-4',
    salaryStructureId: 'str-intern-1',
    code: 'NET',
    name: 'Net Stipend',
    category: 'NET',
    computationType: 'FORMULA',
    calculationType: 'FORMULA',
    sequence: 30,
    percentage: 0,
    quantity: 1,
    fixedAmount: 0,
    formula: 'GROSS',
    active: true,
  },

  // Contractor Rules
  {
    id: 'rul-cnt-1',
    _id: 'rul-cnt-1',
    salaryStructureId: 'str-contractor-1',
    code: 'CONSULT_FEE',
    name: 'Consulting Base Fee',
    category: 'BASIC',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 1,
    percentage: 100,
    quantity: 1,
    fixedAmount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-cnt-2',
    _id: 'rul-cnt-2',
    salaryStructureId: 'str-contractor-1',
    code: 'TDS_194J',
    name: 'TDS Withholding',
    category: 'DED',
    computationType: 'PERCENTAGE',
    calculationType: 'PERCENTAGE',
    sequence: 10,
    percentage: 10,
    quantity: 1,
    fixedAmount: 0,
    formula: '',
    active: true,
  },
  {
    id: 'rul-cnt-3',
    _id: 'rul-cnt-3',
    salaryStructureId: 'str-contractor-1',
    code: 'NET_PAY',
    name: 'Net Payable to Contractor',
    category: 'NET',
    computationType: 'FORMULA',
    calculationType: 'FORMULA',
    sequence: 20,
    percentage: 0,
    quantity: 1,
    fixedAmount: 0,
    formula: 'CONSULT_FEE - TDS_194J',
    active: true,
  },
];

export async function fetchSalaryStructures() {
  try {
    const response = await apiClient('/salary-structures');
    return response.data;
  } catch (err) {
    return mockSalaryStructures;
  }
}

export async function fetchSalaryStructureById(id) {
  try {
    const response = await apiClient(`/salary-structures/${id}`);
    return response.data;
  } catch (err) {
    return mockSalaryStructures.find((s) => s.id === id || s._id === id) || mockSalaryStructures[0];
  }
}

export async function createSalaryStructure(data) {
  try {
    const response = await apiClient('/salary-structures', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const newStructure = {
      id: `str-${Date.now()}`,
      _id: `str-${Date.now()}`,
      name: data.name,
      code: data.code || data.name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
      active: data.active !== false,
      ruleCount: 0,
      employeeCount: 0,
    };
    mockSalaryStructures.push(newStructure);
    return newStructure;
  }
}

export async function updateSalaryStructure(id, data) {
  try {
    const response = await apiClient(`/salary-structures/${id}`, {
      method: 'PATCH',
      body: data,
    });
    return response.data;
  } catch (err) {
    const idx = mockSalaryStructures.findIndex((s) => s.id === id || s._id === id);
    if (idx !== -1) {
      mockSalaryStructures[idx] = { ...mockSalaryStructures[idx], ...data };
      return mockSalaryStructures[idx];
    }
    return data;
  }
}

export async function deleteSalaryStructure(id) {
  try {
    const response = await apiClient(`/salary-structures/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (err) {
    mockSalaryStructures = mockSalaryStructures.filter((s) => s.id !== id && s._id !== id);
    mockSalaryRules = mockSalaryRules.filter((r) => r.salaryStructureId !== id);
    return { success: true };
  }
}

export async function fetchSalaryRules(structureId) {
  try {
    const url = structureId ? `/salary-rules?salaryStructureId=${structureId}` : '/salary-rules';
    const response = await apiClient(url);
    return response.data;
  } catch (err) {
    return mockSalaryRules.filter((r) => !structureId || r.salaryStructureId === structureId);
  }
}

export async function fetchSalaryRuleById(id) {
  try {
    const response = await apiClient(`/salary-rules/${id}`);
    return response.data;
  } catch (err) {
    return mockSalaryRules.find((r) => r.id === id || r._id === id) || mockSalaryRules[0];
  }
}

export async function createSalaryRule(data) {
  const category =
    data.category === 'ALLOWANCE' ? 'ALW' : data.category === 'DEDUCTION' ? 'DED' : data.category || 'ALW';
  const computationType = data.computationType || data.calculationType || 'FIXED';
  const payload = {
    salaryStructureId: data.salaryStructureId,
    code: data.code ? data.code.trim().toUpperCase() : '',
    name: data.name ? data.name.trim() : '',
    category,
    sequence: Number(data.sequence) || 1,
    quantity: Number(data.quantity) || 1,
    computationType,
    fixedAmount: Number(data.fixedAmount ?? data.amount ?? 0),
    percentage: Number(data.percentage || 0),
    formula: data.formula || '',
    active: data.active !== false,
  };

  try {
    const response = await apiClient('/salary-rules', {
      method: 'POST',
      body: payload,
    });
    return response.data;
  } catch (err) {
    const newRule = {
      id: `rul-${Date.now()}`,
      _id: `rul-${Date.now()}`,
      salaryStructureId: payload.salaryStructureId || 'str-reg-1',
      code: payload.code,
      name: payload.name,
      category: payload.category,
      computationType: payload.computationType,
      calculationType: payload.computationType,
      sequence: payload.sequence || mockSalaryRules.length + 1,
      quantity: payload.quantity,
      fixedAmount: payload.fixedAmount,
      amount: payload.fixedAmount,
      percentage: payload.percentage,
      formula: payload.formula,
      active: payload.active,
    };
    mockSalaryRules.push(newRule);
    return newRule;
  }
}

export async function updateSalaryRule(id, data) {
  try {
    const response = await apiClient(`/salary-rules/${id}`, {
      method: 'PATCH',
      body: data,
    });
    return response.data;
  } catch (err) {
    const idx = mockSalaryRules.findIndex((r) => r.id === id || r._id === id);
    if (idx !== -1) {
      mockSalaryRules[idx] = { ...mockSalaryRules[idx], ...data };
      return mockSalaryRules[idx];
    }
    return data;
  }
}

export async function deleteSalaryRule(id) {
  try {
    const response = await apiClient(`/salary-rules/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (err) {
    mockSalaryRules = mockSalaryRules.filter((r) => r.id !== id && r._id !== id);
    return { success: true };
  }
}



export async function fetchPayruns() {
  const response = await apiClient('/payruns');
  return response.data || [];
}

export async function fetchPayrunById(id) {
  const response = await apiClient(`/payruns/${id}`);
  return response.data;
}

export async function createPayrunApi(data) {
  const response = await apiClient('/payruns', {
    method: 'POST',
    body: data,
  });
  return response.data;
}

export async function computePayrunApi(id) {
  const response = await apiClient(`/payruns/${id}/compute`, { method: 'POST' });
  return response.data;
}

export async function validatePayrunApi(id) {
  const response = await apiClient(`/payruns/${id}/validate`, { method: 'POST' });
  return response.data;
}

export async function markPayrunPaidApi(id) {
  const response = await apiClient(`/payruns/${id}/pay`, { method: 'POST' });
  return response.data;
}

export async function fetchEligibleEmployees(params = {}) {
  const query = new URLSearchParams();
  if (params.salaryStructureId) query.set('salaryStructureId', params.salaryStructureId);
  if (params.periodStart) query.set('periodStart', params.periodStart);
  if (params.periodEnd) query.set('periodEnd', params.periodEnd);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient(`/payruns/eligible-employees${queryString}`);
  return response.data || [];
}

export async function fetchPayslipsByPayrun(payrunId) {
  const response = await apiClient(`/payslips?payrunId=${payrunId}`);
  return response.data || [];
}

