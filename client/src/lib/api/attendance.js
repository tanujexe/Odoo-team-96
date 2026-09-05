import { apiClient } from './client';

export let mockAttendanceLogs = [
  {
    id: 'att-john-today',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    employeeCode: 'EMP-001',
    date: '2026-09-05',
    checkIn: '2026-09-05T09:00:00.000Z',
    checkOut: null,
    workedHours: null,
    status: 'PRESENT',
    isCorrected: false,
  },
  {
    id: 'att-john-yesterday',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    employeeCode: 'EMP-001',
    date: '2026-09-04',
    checkIn: '2026-09-04T08:55:00.000Z',
    checkOut: '2026-09-04T17:30:00.000Z',
    workedHours: 8.0,
    status: 'PRESENT',
    isCorrected: false,
  },
  {
    id: 'att-john-prev',
    employeeId: 'emp-john-1',
    employeeName: 'John Developer',
    employeeCode: 'EMP-001',
    date: '2026-09-03',
    checkIn: '2026-09-03T09:02:00.000Z',
    checkOut: '2026-09-03T17:35:00.000Z',
    workedHours: 8.0,
    status: 'PRESENT',
    isCorrected: false,
  },
  {
    id: 'att-1',
    employeeId: 'emp-alex-1',
    employeeName: 'Alex Rivera',
    employeeCode: 'EMP-002',
    date: '2026-09-05',
    checkIn: '2026-09-05T08:58:00.000Z',
    checkOut: null,
    workedHours: null,
    status: 'PRESENT',
    isCorrected: false,
  },
  {
    id: 'att-2',
    employeeId: 'emp-sarah-1',
    employeeName: 'Sarah Connor',
    employeeCode: 'EMP-003',
    date: '2026-09-04',
    checkIn: '2026-09-04T09:02:00.000Z',
    checkOut: '2026-09-04T17:31:00.000Z',
    workedHours: 8.0,
    status: 'PRESENT',
    isCorrected: false,
  },
  {
    id: 'att-3',
    employeeId: 'emp-marcus-1',
    employeeName: 'Marcus Vance',
    employeeCode: 'EMP-004',
    date: '2026-09-04',
    checkIn: '2026-09-04T09:05:00.000Z',
    checkOut: null,
    workedHours: null,
    status: 'EXCEPTION',
    isCorrected: false,
    exceptionReason: 'Missing check-out timestamp',
  },
];

export async function fetchAttendance(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/attendance${query ? `?${query}` : ''}`);
    return response.data;
  } catch (err) {
    let filtered = [...mockAttendanceLogs];
    if (params.employeeId) {
      filtered = filtered.filter((a) => a.employeeId === params.employeeId);
    }
    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    return filtered;
  }
}

export async function checkInApi(employeeId = 'emp-alex-1') {
  try {
    const response = await apiClient('/attendance/check-in', {
      method: 'POST',
      body: { employeeId },
    });
    return response.data;
  } catch (err) {
    const newEntry = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: 'Alex Rivera',
      employeeCode: 'EMP-001',
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toISOString(),
      checkOut: null,
      workedHours: null,
      status: 'PRESENT',
      isCorrected: false,
    };
    mockAttendanceLogs.unshift(newEntry);
    return newEntry;
  }
}

export async function checkOutApi(id) {
  try {
    const response = await apiClient('/attendance/check-out', {
      method: 'POST',
      body: { id },
    });
    return response.data;
  } catch (err) {
    const entry = mockAttendanceLogs.find((a) => a.id === id) || mockAttendanceLogs[0];
    if (entry) {
      entry.checkOut = new Date().toISOString();
      const checkInTime = new Date(entry.checkIn).getTime();
      const checkOutTime = new Date(entry.checkOut).getTime();
      entry.workedHours = Math.max(0.5, Number(((checkOutTime - checkInTime) / (1000 * 60 * 60) - 0.5).toFixed(1)));
      entry.status = 'PRESENT';
    }
    return entry;
  }
}

export async function correctAttendanceApi(id, { checkIn, checkOut, reason }) {
  try {
    const response = await apiClient(`/attendance/${id}/correction`, {
      method: 'PATCH',
      body: { checkIn, checkOut, reason },
    });
    return response.data;
  } catch (err) {
    const entry = mockAttendanceLogs.find((a) => a.id === id);
    if (entry) {
      entry.checkIn = checkIn;
      entry.checkOut = checkOut;
      entry.isCorrected = true;
      entry.correctionReason = reason;
      entry.status = 'CORRECTED';
      if (checkIn && checkOut) {
        const diffH = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60) - 0.5;
        entry.workedHours = Math.max(0, Number(diffH.toFixed(1)));
      }
    }
    return entry;
  }
}
