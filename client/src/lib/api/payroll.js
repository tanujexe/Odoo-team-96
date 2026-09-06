import { apiClient } from './client';
import { mockPayruns } from './mockData';

export let mockPayslips = [
  {
    id: 'ps-aarav-1',
    _id: 'ps-aarav-1',
    payrunId: 'pr-2026-02',
    payrunName: 'February 2026',
    employeeId: 'emp-aarav-1',
    employeeName: 'Aarav Mehta',
    employeeCode: 'EMP-001',
    department: 'Engineering',
    jobPosition: 'Senior Software Engineer',
    salaryStructureId: 'str-reg-1',
    salaryStructureName: 'Regular Salary',
    structureName: 'Regular',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    workedDays: 22,
    baseWage: 80000,
    basic: 50000,
    gross: 80000,
    deductions: 5000,
    net: 75000,
    status: 'Done',
    rawStatus: 'PAID',
    warningLabel: '—',
    warningSeverity: null,
    warnings: [],
    deliveryStatus: 'SENT',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Salary', category: 'Basic', computationType: 'FIXED', sequence: 1, amount: 50000 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 2, amount: 20000 },
      { code: 'STI', name: 'Standard Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 3, amount: 10000 },
      { code: 'GROSS', name: 'Gross Salary', category: 'Gross', computationType: 'FORMULA', sequence: 4, amount: 80000 },
      { code: 'PF', name: 'Provident Fund', category: 'Deduction', computationType: 'FIXED', sequence: 5, amount: -3000 },
      { code: 'PT', name: 'Professional Tax', category: 'Deduction', computationType: 'FIXED', sequence: 6, amount: -2000 },
      { code: 'NET', name: 'Net Salary', category: 'Net', computationType: 'FORMULA', sequence: 7, amount: 75000 },
    ],
  },
  {
    id: 'ps-sara-1',
    _id: 'ps-sara-1',
    payrunId: 'pr-2026-02',
    payrunName: 'February 2026',
    employeeId: 'emp-sara-1',
    employeeName: 'Sara Khan',
    employeeCode: 'EMP-002',
    department: 'Product & Design',
    jobPosition: 'UI/UX Designer',
    salaryStructureId: 'str-reg-1',
    salaryStructureName: 'Regular Salary',
    structureName: 'Regular',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    workedDays: 22,
    baseWage: 96000,
    basic: 60000,
    gross: 96000,
    deductions: 8000,
    net: 88000,
    status: 'Done',
    rawStatus: 'VALIDATED',
    warningLabel: 'A/C missing',
    warningSeverity: 'WARNING',
    warnings: [{ code: 'MISSING_BANK_DETAILS', severity: 'WARNING', message: 'Bank account number missing' }],
    deliveryStatus: 'NOT_SENT',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Salary', category: 'Basic', computationType: 'FIXED', sequence: 1, amount: 60000 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 2, amount: 24000 },
      { code: 'STI', name: 'Standard Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 3, amount: 12000 },
      { code: 'GROSS', name: 'Gross Salary', category: 'Gross', computationType: 'FORMULA', sequence: 4, amount: 96000 },
      { code: 'PF', name: 'Provident Fund', category: 'Deduction', computationType: 'FIXED', sequence: 5, amount: -5000 },
      { code: 'PT', name: 'Professional Tax', category: 'Deduction', computationType: 'FIXED', sequence: 6, amount: -3000 },
      { code: 'NET', name: 'Net Salary', category: 'Net', computationType: 'FORMULA', sequence: 7, amount: 88000 },
    ],
  },
  {
    id: 'ps-john-1',
    _id: 'ps-john-1',
    payrunId: 'pr-2026-02',
    payrunName: 'February 2026',
    employeeId: 'emp-john-1',
    employeeName: 'John Dsouza',
    employeeCode: 'EMP-003',
    department: 'Quality Assurance',
    jobPosition: 'QA Engineer',
    salaryStructureId: 'str-reg-1',
    salaryStructureName: 'Regular Salary',
    structureName: 'Regular',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    workedDays: 20,
    baseWage: 72000,
    basic: 45000,
    gross: 72000,
    deductions: 6000,
    net: 66000,
    status: 'Draft',
    rawStatus: 'DRAFT',
    warningLabel: 'Duplicate',
    warningSeverity: 'BLOCKING',
    warnings: [{ code: 'DUPLICATE_PAYSLIP', severity: 'BLOCKING', message: 'Overlapping payslip draft found' }],
    deliveryStatus: 'NOT_SENT',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Salary', category: 'Basic', computationType: 'FIXED', sequence: 1, amount: 45000 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 2, amount: 18000 },
      { code: 'STI', name: 'Standard Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 3, amount: 9000 },
      { code: 'GROSS', name: 'Gross Salary', category: 'Gross', computationType: 'FORMULA', sequence: 4, amount: 72000 },
      { code: 'PF', name: 'Provident Fund', category: 'Deduction', computationType: 'FIXED', sequence: 5, amount: -4000 },
      { code: 'PT', name: 'Professional Tax', category: 'Deduction', computationType: 'FIXED', sequence: 6, amount: -2000 },
      { code: 'NET', name: 'Net Salary', category: 'Net', computationType: 'FORMULA', sequence: 7, amount: 66000 },
    ],
  },
  {
    id: 'ps-neha-1',
    _id: 'ps-neha-1',
    payrunId: 'pr-2026-02',
    payrunName: 'February 2026',
    employeeId: 'emp-neha-1',
    employeeName: 'Neha Patel',
    employeeCode: 'EMP-004',
    department: 'Human Resources',
    jobPosition: 'HR Executive',
    salaryStructureId: 'str-reg-1',
    salaryStructureName: 'Regular Salary',
    structureName: 'Regular',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    workedDays: 22,
    baseWage: 64000,
    basic: 40000,
    gross: 64000,
    deductions: 5000,
    net: 59000,
    status: 'Done',
    rawStatus: 'PAID',
    warningLabel: '—',
    warningSeverity: null,
    warnings: [],
    deliveryStatus: 'SENT',
    ruleLines: [
      { code: 'BASIC', name: 'Basic Salary', category: 'Basic', computationType: 'FIXED', sequence: 1, amount: 40000 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 2, amount: 16000 },
      { code: 'STI', name: 'Standard Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 3, amount: 8000 },
      { code: 'GROSS', name: 'Gross Salary', category: 'Gross', computationType: 'FORMULA', sequence: 4, amount: 64000 },
      { code: 'PF', name: 'Provident Fund', category: 'Deduction', computationType: 'FIXED', sequence: 5, amount: -3500 },
      { code: 'PT', name: 'Professional Tax', category: 'Deduction', computationType: 'FIXED', sequence: 6, amount: -1500 },
      { code: 'NET', name: 'Net Salary', category: 'Net', computationType: 'FORMULA', sequence: 7, amount: 59000 },
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
  try {
    const response = await apiClient(`/payslips?payrunId=${payrunId}`);
    return response.data || [];
  } catch (err) {
    return mockPayslips.filter((ps) => ps.payrunId === payrunId);
  }
}

export async function fetchPayslips(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.period) query.set('period', params.period);
  if (params.status) query.set('status', params.status);
  if (params.employeeId) query.set('employeeId', params.employeeId);
  if (params.payrunId) query.set('payrunId', params.payrunId);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  try {
    const response = await apiClient(`/payslips${queryString}`);
    return response.data || [];
  } catch (err) {
    let result = [...mockPayslips];
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (ps) =>
          ps.employeeName.toLowerCase().includes(q) ||
          ps.employeeCode.toLowerCase().includes(q) ||
          ps.warningLabel?.toLowerCase().includes(q)
      );
    }
    if (params.status && params.status !== 'ALL') {
      result = result.filter((ps) => ps.status === params.status);
    }
    return result;
  }
}

export async function fetchPayslipById(id) {
  try {
    const response = await apiClient(`/payslips/${id}`);
    return response.data;
  } catch (err) {
    return mockPayslips.find((ps) => ps.id === id || ps._id === id) || mockPayslips[0];
  }
}

export async function createPayslipApi(data) {
  try {
    const response = await apiClient('/payslips', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const newPs = {
      id: `ps-${Date.now()}`,
      _id: `ps-${Date.now()}`,
      payrunId: data.payrunId || 'pr-2026-02',
      payrunName: data.payrunName || 'February 2026',
      employeeId: data.employeeId,
      employeeName: data.employeeName || 'New Employee',
      employeeCode: data.employeeCode || 'EMP-999',
      department: data.department || 'Operations',
      jobPosition: data.jobPosition || 'Specialist',
      salaryStructureId: data.salaryStructureId || 'str-reg-1',
      salaryStructureName: 'Regular Salary',
      structureName: 'Regular',
      periodStart: data.periodStart || '2026-02-01',
      periodEnd: data.periodEnd || '2026-02-28',
      workedDays: data.workedDays || 22,
      baseWage: 80000,
      basic: 50000,
      gross: 80000,
      deductions: 5000,
      net: 75000,
      status: 'Done',
      rawStatus: 'COMPUTED',
      warningLabel: '—',
      warningSeverity: null,
      warnings: [],
      deliveryStatus: 'NOT_SENT',
      ruleLines: [
        { code: 'BASIC', name: 'Basic Salary', category: 'Basic', computationType: 'FIXED', sequence: 1, amount: 50000 },
        { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 2, amount: 20000 },
        { code: 'STI', name: 'Standard Allowance', category: 'Allowance', computationType: 'FIXED', sequence: 3, amount: 10000 },
        { code: 'GROSS', name: 'Gross Salary', category: 'Gross', computationType: 'FORMULA', sequence: 4, amount: 80000 },
        { code: 'PF', name: 'Provident Fund', category: 'Deduction', computationType: 'FIXED', sequence: 5, amount: -3000 },
        { code: 'PT', name: 'Professional Tax', category: 'Deduction', computationType: 'FIXED', sequence: 6, amount: -2000 },
        { code: 'NET', name: 'Net Salary', category: 'Net', computationType: 'FORMULA', sequence: 7, amount: 75000 },
      ],
    };
    mockPayslips.unshift(newPs);
    return newPs;
  }
}

export async function computePayslipByIdApi(id) {
  try {
    const response = await apiClient(`/payslips/${id}/compute`, { method: 'POST' });
    return response.data;
  } catch (err) {
    const idx = mockPayslips.findIndex((ps) => ps.id === id || ps._id === id);
    if (idx !== -1) {
      mockPayslips[idx] = {
        ...mockPayslips[idx],
        status: 'Done',
        rawStatus: 'COMPUTED',
      };
      return mockPayslips[idx];
    }
    return mockPayslips[0];
  }
}

export async function markPayslipPaidByIdApi(id) {
  try {
    const response = await apiClient(`/payslips/${id}/pay`, { method: 'POST' });
    return response.data;
  } catch (err) {
    const idx = mockPayslips.findIndex((ps) => ps.id === id || ps._id === id);
    if (idx !== -1) {
      mockPayslips[idx] = {
        ...mockPayslips[idx],
        status: 'Done',
        rawStatus: 'PAID',
      };
      return mockPayslips[idx];
    }
    return mockPayslips[0];
  }
}


