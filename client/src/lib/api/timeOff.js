import { apiClient } from './client';

export let mockLeaveBalances = {
  'emp-john-1': {
    pto: { available: 16.0, total: 20.0, consumed: 4.0 },
    sick: { available: 9.0, total: 10.0, consumed: 1.0 },
    unpaid: { available: 0, total: 0, consumed: 0 },
  },
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
    id: 'req-john-1',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    leaveType: 'PAID_TIME_OFF',
    leaveTypeName: 'Paid Time Off (PTO)',
    startDate: '2026-09-18',
    endDate: '2026-09-20',
    days: 3,
    status: 'APPROVED',
    reason: 'Family event',
    createdAt: '2026-09-01T10:00:00Z',
  },
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
    if (response && response.data) {
      return response.data;
    }
  } catch (err) {
    // Dynamic fallback below
  }

  const empRequests = mockLeaveRequests.filter(
    (r) => (r.employeeId === employeeId || employeeId === 'emp-alex-1') && r.status === 'APPROVED'
  );

  const ptoTaken = empRequests
    .filter((r) => r.leaveType === 'PAID_TIME_OFF' || r.leaveTypeName?.includes('Paid'))
    .reduce((sum, r) => sum + (r.paidDuration ?? r.days ?? 0), 0);

  const sickTaken = empRequests
    .filter((r) => r.leaveType === 'SICK_LEAVE' || r.leaveTypeName?.includes('Sick'))
    .reduce((sum, r) => sum + (r.paidDuration ?? r.days ?? 0), 0);

  const unpaidTaken = empRequests
    .reduce((sum, r) => sum + (r.unpaidDuration || (r.leaveType === 'UNPAID_LEAVE' ? (r.days || 0) : 0)), 0);

  const basePtoTotal = mockLeaveBalances[employeeId]?.pto?.total || 20;
  const baseSickTotal = mockLeaveBalances[employeeId]?.sick?.total || 10;

  const dynamicBalances = {
    pto: {
      total: basePtoTotal,
      consumed: ptoTaken,
      available: Math.max(0, basePtoTotal - ptoTaken),
    },
    sick: {
      total: baseSickTotal,
      consumed: sickTaken,
      available: Math.max(0, baseSickTotal - sickTaken),
    },
    unpaid: {
      total: 0,
      consumed: unpaidTaken,
      available: 0,
    },
  };

  mockLeaveBalances[employeeId] = dynamicBalances;
  return dynamicBalances;
}

export async function fetchTimeOffRequests(params = {}) {
  const cleanParams = {};
  if (params.employeeId && params.employeeId !== 'null' && params.employeeId !== 'undefined') {
    cleanParams.employeeId = params.employeeId;
  }
  if (params.status) {
    cleanParams.status = params.status;
  }

  try {
    const query = new URLSearchParams(cleanParams).toString();
    const response = await apiClient(`/time-off/requests${query ? `?${query}` : ''}`);
    if (response && response.data) {
      return response.data;
    }
    throw new Error('No data returned');
  } catch (err) {
    let filtered = [...mockLeaveRequests];
    if (cleanParams.employeeId) {
      filtered = filtered.filter((r) => r.employeeId === cleanParams.employeeId);
    }
    if (cleanParams.status) {
      filtered = filtered.filter((r) => r.status === cleanParams.status);
    }
    return filtered;
  }
}

export async function createTimeOffRequest(data) {
  const isHalf = data.requestUnit === 'HALF_AM' || data.requestUnit === 'HALF_PM';
  const totalDays = isHalf ? 0.5 : Number(data.days) || 1;

  // Resolve typeId for backend API if needed
  let typeId = data.typeId;
  if (!typeId) {
    try {
      const typesRes = await apiClient('/time-off/types');
      if (typesRes && typesRes.data && Array.isArray(typesRes.data)) {
        const targetCode =
          data.leaveType === 'SICK_LEAVE'
            ? 'SICK'
            : data.leaveType === 'UNPAID_LEAVE'
            ? 'UNPAID'
            : 'PTO';
        const found = typesRes.data.find(
          (t) => t.code === targetCode || t.name.toLowerCase().includes(targetCode.toLowerCase())
        );
        if (found) typeId = found._id;
      }
    } catch (e) {
      // Fallback if types endpoint is unavailable
    }
  }

  const payload = {
    ...data,
    typeId: typeId || '66d9f8000000000000000001',
    duration: totalDays,
    description: data.reason || data.description || '',
  };

  const newMockReq = {
    id: `req-${Date.now()}`,
    _id: `req-${Date.now()}`,
    employeeId: data.employeeId || 'emp-alex-1',
    employeeName: data.employeeName || 'Alex Rivera',
    leaveType: data.leaveType || 'PAID_TIME_OFF',
    leaveTypeName:
      data.leaveType === 'SICK_LEAVE'
        ? 'Sick Leave'
        : data.leaveType === 'UNPAID_LEAVE'
        ? 'Unpaid Leave (LWP)'
        : 'Paid Time Off (PTO)',
    requestUnit: data.requestUnit || 'FULL',
    startDate: data.startDate,
    endDate: data.endDate,
    days: totalDays,
    duration: totalDays,
    paidDuration: totalDays,
    unpaidDuration: 0,
    status: 'PENDING',
    reason: data.reason || 'Personal time off',
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await apiClient('/time-off/requests', {
      method: 'POST',
      body: payload,
    });
    mockLeaveRequests.unshift(newMockReq);
    return response.data;
  } catch (err) {
    // Calculate balance overflow in mock store
    const bal = mockLeaveBalances[data.employeeId || 'emp-alex-1'] || mockLeaveBalances['emp-alex-1'];
    let available = 0;
    if (data.leaveType === 'PAID_TIME_OFF') available = bal?.pto?.available || 0;
    else if (data.leaveType === 'SICK_LEAVE') available = bal?.sick?.available || 0;

    if (data.leaveType === 'UNPAID_LEAVE') {
      newMockReq.paidDuration = 0;
      newMockReq.unpaidDuration = totalDays;
    } else if (totalDays > available) {
      newMockReq.paidDuration = Math.max(0, available);
      newMockReq.unpaidDuration = totalDays - newMockReq.paidDuration;
    }

    mockLeaveRequests.unshift(newMockReq);
    return newMockReq;
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
      const paidToDeduct = req.paidDuration ?? req.days;
      const unpaidToAdd = req.unpaidDuration ?? 0;

      if (req.leaveType === 'PAID_TIME_OFF') {
        bal.pto.available = Math.max(0, bal.pto.available - paidToDeduct);
        bal.pto.consumed += paidToDeduct;
      } else if (req.leaveType === 'SICK_LEAVE') {
        bal.sick.available = Math.max(0, bal.sick.available - paidToDeduct);
        bal.sick.consumed += paidToDeduct;
      }
      bal.unpaid.consumed += unpaidToAdd;
    }
    return req;
  }
}

export async function refuseTimeOffRequest({ id, reason }) {
  try {
    const response = await apiClient(`/time-off/requests/${id}/refuse`, {
      method: 'POST',
      body: { reason },
    });
    return response.data;
  } catch (err) {
    const req = mockLeaveRequests.find((r) => r.id === id);
    if (req) {
      req.status = 'REFUSED';
      req.refusalReason = reason || 'Not approved by manager';
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
        const paidToRestore = req.paidDuration ?? req.days;
        const unpaidToRestore = req.unpaidDuration ?? 0;

        if (req.leaveType === 'PAID_TIME_OFF') {
          bal.pto.available += paidToRestore;
          bal.pto.consumed = Math.max(0, bal.pto.consumed - paidToRestore);
        } else if (req.leaveType === 'SICK_LEAVE') {
          bal.sick.available += paidToRestore;
          bal.sick.consumed = Math.max(0, bal.sick.consumed - paidToRestore);
        }
        bal.unpaid.consumed = Math.max(0, bal.unpaid.consumed - unpaidToRestore);
      }
      req.status = 'CANCELLED';
    }
    return req;
  }
}
