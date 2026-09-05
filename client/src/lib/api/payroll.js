import { apiClient } from './client';

export let mockSalaryStructures = [
  {
    id: 'str-tech-1',
    name: 'Standard Tech Structure',
    code: 'STR_TECH',
    ruleCount: 5,
  },
  {
    id: 'str-exec-1',
    name: 'Executive Leadership Structure',
    code: 'STR_EXEC',
    ruleCount: 4,
  },
];

export let mockSalaryRules = [
  {
    id: 'rul-1',
    salaryStructureId: 'str-tech-1',
    code: 'BASIC',
    name: 'Basic Wage',
    category: 'BASIC',
    calculationType: 'FIXED',
    sequence: 1,
    amount: 1.0, // 100% of base contract wage
  },
  {
    id: 'rul-2',
    salaryStructureId: 'str-tech-1',
    code: 'HRA',
    name: 'House Rent Allowance',
    category: 'ALLOWANCE',
    calculationType: 'PERCENTAGE',
    sequence: 2,
    percentage: 15.0,
  },
  {
    id: 'rul-3',
    salaryStructureId: 'str-tech-1',
    code: 'CONV',
    name: 'Conveyance Allowance',
    category: 'ALLOWANCE',
    calculationType: 'FIXED',
    sequence: 3,
    amount: 250,
  },
  {
    id: 'rul-4',
    salaryStructureId: 'str-tech-1',
    code: 'PF',
    name: 'Provident Fund Deduction',
    category: 'DEDUCTION',
    calculationType: 'PERCENTAGE',
    sequence: 4,
    percentage: 12.0,
  },
  {
    id: 'rul-5',
    salaryStructureId: 'str-tech-1',
    code: 'TAX_ADJ',
    name: 'Standard Withholding Tax',
    category: 'DEDUCTION',
    calculationType: 'FORMULA',
    sequence: 5,
    formula: '(BASIC + HRA) * 0.10',
  },
];

export let mockPayruns = [
  {
    id: 'pr-2026-09',
    name: 'September 2026 Regular Payrun',
    salaryStructureId: 'str-tech-1',
    salaryStructureName: 'Standard Tech Structure',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    status: 'COMPUTED', // 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID'
    employeeIds: ['emp-alex-1', 'emp-sarah-1'],
    employeeCount: 2,
    totals: {
      totalGross: 18275,
      totalDeductions: 3770,
      totalNet: 14505,
    },
    warnings: [
      {
        code: 'MISSING_ATTENDANCE_CHECKOUT',
        severity: 'WARNING',
        employeeId: 'emp-marcus-1',
        message: 'Marcus Vance has 1 uncorrected attendance exception in this period.',
      },
    ],
    createdAt: '2026-09-02T10:00:00Z',
  },
];

export let mockPayslips = [
  {
    id: 'ps-alex-1',
    payrunId: 'pr-2026-09',
    employeeId: 'emp-alex-1',
    employeeName: 'Alex Rivera',
    employeeCode: 'EMP-001',
    department: 'Engineering',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    status: 'COMPUTED',
    deliveryStatus: 'NOT_SENT',
    baseWage: 8500,
    gross: 10025,
    deductions: 2070,
    net: 7955,
    ruleLines: [
      { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', calculationType: 'FIXED', rate: '100%', amount: 8500, total: 8500 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', calculationType: 'PERCENTAGE', rate: '15%', amount: 1275, total: 1275 },
      { code: 'CONV', name: 'Conveyance Allowance', category: 'ALLOWANCE', calculationType: 'FIXED', rate: 'Fixed', amount: 250, total: 250 },
      { code: 'PF', name: 'Provident Fund Deduction', category: 'DEDUCTION', calculationType: 'PERCENTAGE', rate: '12%', amount: 1020, total: -1020 },
      { code: 'TAX_ADJ', name: 'Standard Withholding Tax', category: 'DEDUCTION', calculationType: 'FORMULA', rate: '10%', amount: 1050, total: -1050 },
    ],
  },
  {
    id: 'ps-sarah-1',
    payrunId: 'pr-2026-09',
    employeeId: 'emp-sarah-1',
    employeeName: 'Sarah Connor',
    employeeCode: 'EMP-002',
    department: 'Finance & Payroll',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    status: 'COMPUTED',
    deliveryStatus: 'NOT_SENT',
    baseWage: 7200,
    gross: 8250,
    deductions: 1700,
    net: 6550,
    ruleLines: [
      { code: 'BASIC', name: 'Basic Wage', category: 'BASIC', calculationType: 'FIXED', rate: '100%', amount: 7200, total: 7200 },
      { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', calculationType: 'PERCENTAGE', rate: '15%', amount: 1080, total: 1080 },
      { code: 'CONV', name: 'Conveyance Allowance', category: 'ALLOWANCE', calculationType: 'FIXED', rate: 'Fixed', amount: 250, total: 250 },
      { code: 'PF', name: 'Provident Fund Deduction', category: 'DEDUCTION', calculationType: 'PERCENTAGE', rate: '12%', amount: 864, total: -864 },
      { code: 'TAX_ADJ', name: 'Standard Withholding Tax', category: 'DEDUCTION', calculationType: 'FORMULA', rate: '10%', amount: 836, total: -836 },
    ],
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

export async function fetchSalaryRules(structureId) {
  try {
    const url = structureId ? `/salary-rules?salaryStructureId=${structureId}` : '/salary-rules';
    const response = await apiClient(url);
    return response.data;
  } catch (err) {
    return mockSalaryRules.filter((r) => !structureId || r.salaryStructureId === structureId);
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
    computationType,
    fixedAmount: Number(data.fixedAmount ?? data.amount ?? 0),
    percentage: Number(data.percentage || 0),
    formula: data.formula || '',
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
      salaryStructureId: payload.salaryStructureId || 'str-tech-1',
      code: payload.code,
      name: payload.name,
      category: payload.category,
      computationType: payload.computationType,
      calculationType: payload.computationType,
      sequence: payload.sequence || mockSalaryRules.length + 1,
      fixedAmount: payload.fixedAmount,
      amount: payload.fixedAmount,
      percentage: payload.percentage,
      formula: payload.formula,
    };
    mockSalaryRules.push(newRule);
    return newRule;
  }
}


export async function fetchPayruns() {
  try {
    const response = await apiClient('/payruns');
    return response.data;
  } catch (err) {
    return mockPayruns;
  }
}

export async function fetchPayrunById(id) {
  try {
    const response = await apiClient(`/payruns/${id}`);
    return response.data;
  } catch (err) {
    return mockPayruns.find((p) => p.id === id) || mockPayruns[0];
  }
}

export async function createPayrunApi(data) {
  try {
    const response = await apiClient('/payruns', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const structure = mockSalaryStructures.find((s) => s.id === data.salaryStructureId);
    const newRun = {
      id: `pr-${Date.now()}`,
      name: data.name || 'New Payrun Batch',
      salaryStructureId: data.salaryStructureId,
      salaryStructureName: structure?.name || 'Standard Tech Structure',
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: 'DRAFT',
      employeeIds: data.employeeIds || [],
      employeeCount: data.employeeIds?.length || 0,
      totals: { totalGross: 0, totalDeductions: 0, totalNet: 0 },
      warnings: [],
      createdAt: new Date().toISOString(),
    };
    mockPayruns.unshift(newRun);
    return newRun;
  }
}

export async function computePayrunApi(id) {
  try {
    const response = await apiClient(`/payruns/${id}/compute`, { method: 'POST' });
    return response.data;
  } catch (err) {
    const run = mockPayruns.find((p) => p.id === id);
    if (run) {
      run.status = 'COMPUTED';
      run.totals = { totalGross: 18275, totalDeductions: 3770, totalNet: 14505 };
    }
    return { payrun: run, payslips: mockPayslips, warnings: run?.warnings || [] };
  }
}

export async function validatePayrunApi(id) {
  try {
    const response = await apiClient(`/payruns/${id}/validate`, { method: 'POST' });
    return response.data;
  } catch (err) {
    const run = mockPayruns.find((p) => p.id === id);
    if (run) {
      const hasBlocking = run.warnings?.some((w) => w.severity === 'BLOCKING');
      if (hasBlocking) {
        return Promise.reject({
          code: 'BLOCKING_WARNINGS_EXIST',
          message: 'Payrun cannot be validated due to active blocking warnings.',
          warnings: run.warnings,
        });
      }
      run.status = 'VALIDATED';
    }
    return run;
  }
}

export async function markPayrunPaidApi(id) {
  try {
    const response = await apiClient(`/payruns/${id}/pay`, { method: 'POST' });
    return response.data;
  } catch (err) {
    const run = mockPayruns.find((p) => p.id === id);
    if (run) {
      run.status = 'PAID';
      mockPayslips.forEach((ps) => {
        if (ps.payrunId === id) ps.status = 'PAID';
      });
    }
    return run;
  }
}

export async function fetchPayslipsByPayrun(payrunId) {
  try {
    const response = await apiClient(`/payslips?payrunId=${payrunId}`);
    return response.data;
  } catch (err) {
    return mockPayslips.filter((p) => !payrunId || p.payrunId === payrunId);
  }
}
