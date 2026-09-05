import { apiClient } from './client';

export let mockLeaveBalances = {
  'emp-alex-1': {
    pto: { available: 14.5, total: 20.0, consumed: 5.5 },
    sick: { available: 8.0, total: 10.0, consumed: 2.0 },
    unpaid: { available: 0, total: 0, consumed: 0 },
  },
  'emp-marcus-1': {
    pto: { available: 11.0, total: 15.0, consumed: 4.0 },
    sick: { available: 9.0, total: 10.0, consumed: 1.0 },
    unpaid: { available: 0, total: 0, consumed: 0 },
  },
  'emp-sarah-1': {
    pto: { available: 18.0, total: 22.0, consumed: 4.0 },
    sick: { available: 10.0, total: 10.0, consumed: 0 },
    unpaid: { available: 0, total: 0, consumed: 0 },
  },
};

export let mockLeaveRequests = [
  {
    id: 'req-1',
    employeeId: 'emp-marcus-1',
    employeeName: 'Marcus Vance',
    leaveType: 'PAID_TIME_OFF',
    leaveTypeName: 'Paid Time Off (PTO)',
    startDate: '2026-09-15',
    endDate: '2026-09-17',
    days: 3,
    status: 'PENDING',
    reason: 'Family wedding out of town',
    createdAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'req-2',
    employeeId: 'emp-alex-1',
    employeeName: 'Alex Rivera',
    leaveType: 'SICK_LEAVE',
    leaveTypeName: 'Sick Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-20',
    days: 1,
    status: 'APPROVED',
    reason: 'Severe migraine recovery',
    createdAt: '2026-08-19T08:30:00Z',
  },
];

export async function fetchTimeOffBalances(employeeId = 'emp-alex-1') {
  try {
    const response = await apiClient(`/time-off/balances?employeeId=${employeeId}`);
    return response.data;
  } catch (err) {
    return mockLeaveBalances[employeeId] || mockLeaveBalances['emp-alex-1'];
  }
}

export async function fetchTimeOffRequests(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/time-off/requests${query ? `?${query}` : ''}`);
    return response.data;
  } catch (err) {
    let filtered = [...mockLeaveRequests];
    if (params.employeeId) {
      filtered = filtered.filter((r) => r.employeeId === params.employeeId);
    }
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    return filtered;
  }
}

export async function createTimeOffRequest(data) {
  try {
    const response = await apiClient('/time-off/requests', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const newReq = {
      id: `req-${Date.now()}`,
      employeeId: data.employeeId || 'emp-alex-1',
      employeeName: data.employeeName || 'Alex Rivera',
      leaveType: data.leaveType || 'PAID_TIME_OFF',
      leaveTypeName: data.leaveType === 'SICK_LEAVE' ? 'Sick Leave' : 'Paid Time Off (PTO)',
      startDate: data.startDate,
      endDate: data.endDate,
      days: Number(data.days) || 1,
      status: 'PENDING',
      reason: data.reason || 'Personal time off',
      createdAt: new Date().toISOString(),
    };
    mockLeaveRequests.unshift(newReq);
    return newReq;
  }
}

export async function approveTimeOffRequest(id) {
  try {
    const response = await apiClient(`/time-off/requests/${id}/approve`, {
      method: 'POST',
    });
    return response.data;
  } catch (err) {
    const req = mockLeaveRequests.find((r) => r.id === id);
    if (req) {
      req.status = 'APPROVED';
      const bal = mockLeaveBalances[req.employeeId] || mockLeaveBalances['emp-alex-1'];
      if (req.leaveType === 'PAID_TIME_OFF') {
        bal.pto.available = Math.max(0, bal.pto.available - req.days);
        bal.pto.consumed += req.days;
      } else if (req.leaveType === 'SICK_LEAVE') {
        bal.sick.available = Math.max(0, bal.sick.available - req.days);
        bal.sick.consumed += req.days;
      }
    }
    return req;
  }
}

export async function refuseTimeOffRequest(id) {
  try {
    const response = await apiClient(`/time-off/requests/${id}/refuse`, {
      method: 'POST',
    });
    return response.data;
  } catch (err) {
    const req = mockLeaveRequests.find((r) => r.id === id);
    if (req) {
      req.status = 'REFUSED';
    }
    return req;
  }
}

export async function cancelTimeOffRequest(id) {
  try {
    const response = await apiClient(`/time-off/requests/${id}/cancel`, {
      method: 'POST',
    });
    return response.data;
  } catch (err) {
    const req = mockLeaveRequests.find((r) => r.id === id);
    if (req) {
      if (req.status === 'APPROVED') {
        const bal = mockLeaveBalances[req.employeeId] || mockLeaveBalances['emp-alex-1'];
        if (req.leaveType === 'PAID_TIME_OFF') {
          bal.pto.available += req.days;
          bal.pto.consumed = Math.max(0, bal.pto.consumed - req.days);
        } else if (req.leaveType === 'SICK_LEAVE') {
          bal.sick.available += req.days;
          bal.sick.consumed = Math.max(0, bal.sick.consumed - req.days);
        }
      }
      req.status = 'CANCELLED';
    }
    return req;
  }
}
