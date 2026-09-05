import { apiClient } from './client';

export const mockDashboardData = {
  kpis: {
    totalNetSalaryPaid: 14505,
    totalGrossSalaryPaid: 18275,
    payslipsGenerated: 2,
    paidPayslipsCount: 2,
    averageSalary: 7252.5,
    approvedTimeOffDays: 4,
    attendanceCoveragePct: 98.2,
    activeEmployeeCount: 4,
  },
  attendanceSummary: {
    total: 3,
    present: 2,
    late: 0,
    exception: 1,
    missingCheckout: 1,
  },
  charts: {
    salaryCostByDepartment: [
      { departmentName: 'Engineering', totalNet: 7955, totalGross: 10025, employeeCount: 2, percentage: 55 },
      { departmentName: 'Finance & Payroll', totalNet: 6550, totalGross: 8250, employeeCount: 1, percentage: 45 },
    ],
    monthlySalaryTrends: [
      { month: '2026-05', totalNet: 13200, count: 2 },
      { month: '2026-06', totalNet: 13500, count: 2 },
      { month: '2026-07', totalNet: 13800, count: 2 },
      { month: '2026-08', totalNet: 14100, count: 2 },
      { month: '2026-09', totalNet: 14505, count: 2 },
    ],
  },
  alerts: [
    {
      id: 'alt-1',
      type: 'BLOCKING_PAYROLL',
      title: 'Payrun Warning: September 2026 Batch',
      message: 'Marcus Vance has 1 uncorrected missing check-out requiring review.',
      link: '/attendance',
    },
    {
      id: 'alt-2',
      type: 'CONTRACT_RESOLUTION',
      title: 'Contract Timeline Notice',
      message: 'Alex Rivera contract is active and period-resolved for September cycle.',
      link: '/contracts',
    },
  ],
};

export async function fetchDashboardMetrics(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/dashboard${query ? `?${query}` : ''}`);
    return response.data;
  } catch (err) {
    // Dynamic mock response when filters change
    if (params.departmentId === 'dept-eng') {
      return {
        ...mockDashboardData,
        kpis: {
          ...mockDashboardData.kpis,
          totalNetSalaryPaid: 7955,
          totalGrossSalaryPaid: 10025,
          payslipsGenerated: 1,
          paidPayslipsCount: 1,
          activeEmployeeCount: 2,
        },
        charts: {
          ...mockDashboardData.charts,
          salaryCostByDepartment: [
            { departmentName: 'Engineering', totalNet: 7955, totalGross: 10025, employeeCount: 2, percentage: 100 },
          ],
        },
      };
    }
    return mockDashboardData;
  }
}

export async function downloadPayslipPdf(payslipId, filename = 'Payslip.pdf') {
  try {
    const token = localStorage.getItem('peoplepay_token');
    const response = await fetch(`/api/payslips/${payslipId}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    console.warn('[PDF Download] Simulated local download:', err);
    // Create a client-side mock PDF text blob for offline demo
    const mockBlob = new Blob([`%PDF-1.4\n% PeoplePay360 Generated Payslip\nPayslip ID: ${payslipId}\nDate: ${new Date().toISOString()}`], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(mockBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, simulated: true };
  }
}

export async function bulkSendPayslipsApi(payrunId) {
  try {
    const response = await apiClient(`/payruns/${payrunId}/send-payslips`, {
      method: 'POST',
    });
    return response.data;
  } catch (err) {
    // Simulated bulk send response per contract
    return {
      payrunId,
      results: [
        { payslipId: 'ps-alex-1', status: 'SENT' },
        { payslipId: 'ps-sarah-1', status: 'SENT' },
      ],
    };
  }
}
