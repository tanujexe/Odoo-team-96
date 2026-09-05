import { apiClient } from './client';

export function normalizeAttendanceLog(log) {
  if (!log) return log;
  const empObj = typeof log.employeeId === 'object' && log.employeeId !== null ? log.employeeId : null;
  const empName =
    log.employeeName ||
    empObj?.name ||
    (empObj?.firstName ? `${empObj.firstName} ${empObj.lastName || ''}`.trim() : null) ||
    'Aarav Mehta';
  const empCode = log.employeeCode || empObj?.employeeCode || (typeof log.employeeId === 'string' ? log.employeeId : 'EMP-001');
  const dept = log.department || empObj?.department || 'Finance';
  const manager = log.manager || empObj?.manager || 'Sara Khan';

  let workedHours = log.workedHours;
  let overtime = log.overtime ?? 0;

  if (workedHours === undefined || workedHours === null) {
    if (log.checkIn && log.checkOut) {
      const durationMs = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime();
      workedHours = Math.max(0, Number((durationMs / (1000 * 60 * 60)).toFixed(2)));
    } else {
      workedHours = 0;
    }
  }

  if (workedHours > 8 && overtime === 0) {
    overtime = Number((workedHours - 8).toFixed(2));
  }

  return {
    ...log,
    id: log._id || log.id,
    employeeId: empObj ? empObj._id || empObj.id : log.employeeId,
    employeeName: empName,
    employeeCode: empCode,
    department: dept,
    manager: manager,
    workedHours,
    overtime,
    status: log.status || (log.checkIn ? 'PRESENT' : 'ABSENT'),
    notes: log.notes || log.correctionReason || 'System recorded or manually corrected by an authorized user.',
  };
}

export let mockAttendanceLogs = [
  {
    id: 'att-aarav-1',
    employeeId: 'emp-aarav-1',
    employeeName: 'Aarav Mehta',
    employeeCode: 'EMP-001',
    department: 'Finance',
    manager: 'Sara Khan',
    date: '2026-09-02',
    checkIn: '2026-09-02T09:01:00.000Z',
    checkOut: '2026-09-02T18:10:00.000Z',
    workedHours: 9.08,
    overtime: 0.5,
    status: 'PRESENT',
    notes: 'System recorded or manually corrected by an authorized user.',
  },
  {
    id: 'att-sara-1',
    employeeId: 'emp-sara-1',
    employeeName: 'Sara Khan',
    employeeCode: 'EMP-002',
    department: 'Human Resources',
    manager: 'System Admin',
    date: '2026-09-02',
    checkIn: '2026-09-02T09:15:00.000Z',
    checkOut: '2026-09-02T18:02:00.000Z',
    workedHours: 8.78,
    overtime: 0.0,
    status: 'PRESENT',
    notes: 'On schedule shift completed.',
  },
  {
    id: 'att-john-1',
    employeeId: 'emp-john-1',
    employeeName: 'John Dsouza',
    employeeCode: 'EMP-003',
    department: 'Engineering',
    manager: 'Sara Khan',
    date: '2026-09-02',
    checkIn: '2026-09-02T09:22:00.000Z',
    checkOut: '2026-09-02T17:58:00.000Z',
    workedHours: 8.43,
    overtime: 0.0,
    status: 'PRESENT',
    notes: 'Standard shift punch.',
  },
  {
    id: 'att-neha-1',
    employeeId: 'emp-neha-1',
    employeeName: 'Neha Patel',
    employeeCode: 'EMP-004',
    department: 'Talent Acquisition',
    manager: 'Sara Khan',
    date: '2026-09-02',
    checkIn: null,
    checkOut: null,
    workedHours: 0.0,
    overtime: 0.0,
    status: 'ABSENT',
    notes: 'Unplanned absence recorded.',
  },
  {
    id: 'att-vikram-1',
    employeeId: 'emp-vikram-1',
    employeeName: 'Vikram Rao',
    employeeCode: 'EMP-005',
    department: 'Operations',
    manager: 'Sara Khan',
    date: '2026-09-02',
    checkIn: '2026-09-02T09:10:00.000Z',
    checkOut: null,
    workedHours: 4.5,
    overtime: 0.0,
    status: 'ON_DUTY',
    notes: 'Field assignment on duty shift.',
  },
];

export let checkedInEmployeeIds = new Set(['emp-alex-1', 'EMP001', 'emp-john-1', 'emp-aarav-1']);

export function isEmployeeCheckedIn(employeeId, employeeCode) {
  if (!employeeId && !employeeCode) return false;
  if (
    (employeeId && checkedInEmployeeIds.has(employeeId)) ||
    (employeeCode && checkedInEmployeeIds.has(employeeCode))
  ) {
    return true;
  }
  return mockAttendanceLogs.some(
    (a) =>
      (a.employeeId === employeeId || a.employeeCode === employeeCode) &&
      a.checkIn &&
      !a.checkOut
  );
}

export function setEmployeeCheckInStatus(employeeId, employeeCode, isCheckedIn) {
  if (isCheckedIn) {
    if (employeeId) checkedInEmployeeIds.add(employeeId);
    if (employeeCode) checkedInEmployeeIds.add(employeeCode);
  } else {
    if (employeeId) checkedInEmployeeIds.delete(employeeId);
    if (employeeCode) checkedInEmployeeIds.delete(employeeCode);
  }
}

export async function fetchAttendance(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await apiClient(`/attendance${query ? `?${query}` : ''}`);
    const list = Array.isArray(response.data) ? response.data : [];
    const normalized = list.map(normalizeAttendanceLog);
    const serverIds = new Set(normalized.map((a) => a.id));
    const extraMocks = mockAttendanceLogs.filter((m) => !serverIds.has(m.id)).map(normalizeAttendanceLog);
    return [...normalized, ...extraMocks];
  } catch (err) {
    let filtered = mockAttendanceLogs.map(normalizeAttendanceLog);
    if (params.employeeId) {
      filtered = filtered.filter((a) => a.employeeId === params.employeeId);
    }
    if (params.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    return filtered;
  }
}

export async function checkInApi(employeeId = 'emp-aarav-1') {
  setEmployeeCheckInStatus(employeeId, null, true);
  try {
    const response = await apiClient('/attendance/check-in', {
      method: 'POST',
      body: { employeeId },
    });
    return normalizeAttendanceLog(response.data);
  } catch (err) {
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: 'Aarav Mehta',
      employeeCode: 'EMP-001',
      department: 'Finance',
      manager: 'Sara Khan',
      date: todayStr,
      checkIn: new Date().toISOString(),
      checkOut: null,
      workedHours: null,
      overtime: 0,
      status: 'PRESENT',
      notes: 'Self-service terminal check in.',
    };
    mockAttendanceLogs.unshift(newEntry);
    return normalizeAttendanceLog(newEntry);
  }
}

export async function checkOutApi(id, employeeId = 'emp-aarav-1') {
  setEmployeeCheckInStatus(employeeId, null, false);
  try {
    const response = await apiClient('/attendance/check-out', {
      method: 'POST',
      body: { id },
    });
    return normalizeAttendanceLog(response.data);
  } catch (err) {
    const entry = mockAttendanceLogs.find((a) => a.id === id) || mockAttendanceLogs[0];
    if (entry) {
      entry.checkOut = new Date().toISOString();
      const checkInTime = new Date(entry.checkIn || new Date()).getTime();
      const checkOutTime = new Date(entry.checkOut).getTime();
      const hours = Math.max(0, Number(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2)));
      entry.workedHours = hours;
      entry.overtime = hours > 8 ? Number((hours - 8).toFixed(2)) : 0;
      entry.status = 'PRESENT';
    }
    return normalizeAttendanceLog(entry);
  }
}

export async function correctAttendanceApi(id, data) {
  try {
    const response = await apiClient(`/attendance/${id}/correction`, {
      method: 'PATCH',
      body: data,
    });
    return normalizeAttendanceLog(response.data);
  } catch (err) {
    let entry = mockAttendanceLogs.find((a) => a.id === id);
    if (!entry) {
      entry = { id: id || `att-${Date.now()}`, ...data };
      mockAttendanceLogs.unshift(entry);
    } else {
      Object.assign(entry, data);
    }
    return normalizeAttendanceLog(entry);
  }
}
