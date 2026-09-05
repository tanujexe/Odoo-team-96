import { apiClient } from './client';
import { mockWorkingSchedules } from './mockData';

const DAY_MAP = {
  monday: 'MON',
  mon: 'MON',
  tuesday: 'TUE',
  tue: 'TUE',
  wednesday: 'WED',
  wed: 'WED',
  thursday: 'THU',
  thu: 'THU',
  friday: 'FRI',
  fri: 'FRI',
  saturday: 'SAT',
  sat: 'SAT',
  sunday: 'SUN',
  sun: 'SUN',
};

function parseBreakMinutes(breakVal) {
  if (typeof breakVal === 'number') return breakVal;
  if (!breakVal) return 0;
  const str = String(breakVal).trim().toLowerCase();
  if (str.endsWith('h')) {
    const hours = parseFloat(str.replace('h', ''));
    return isNaN(hours) ? 0 : Math.round(hours * 60);
  }
  if (str.endsWith('m') || str.endsWith('min')) {
    const mins = parseFloat(str.replace(/[^\d.]/g, ''));
    return isNaN(mins) ? 0 : Math.round(mins);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

function normalizePayload(data) {
  const rawDays = data.days || data.workDays || [];
  const days = (Array.isArray(rawDays) ? rawDays : [])
    .filter((d) => d && d.isWorkDay !== false)
    .map((d) => {
      const dayKey = String(d.day || '').toLowerCase().trim();
      const mappedDay = DAY_MAP[dayKey] || (['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(String(d.day).toUpperCase()) ? String(d.day).toUpperCase() : 'MON');
      const breakMins = parseBreakMinutes(d.breakMinutes);
      return {
        day: mappedDay,
        startTime: d.startTime || '09:00',
        endTime: d.endTime || '18:00',
        breakMinutes: typeof breakMins === 'number' && !isNaN(breakMins) ? breakMins : 60,
      };
    });

  const statusStr = typeof data.status === 'string' ? data.status.toUpperCase() : 'ACTIVE';
  const status = statusStr === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  return {
    name: data.name || 'New Working Schedule',
    type: data.type || (data.weeklyHours && data.weeklyHours < 30 ? 'PART_TIME' : 'FULL_TIME'),
    days: days.length > 0 ? days : [
      { day: 'MON', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'TUE', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'WED', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'THU', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { day: 'FRI', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    ],
    status,
  };
}

export async function fetchSchedules() {
  try {
    const response = await apiClient('/schedules');
    return response.data;
  } catch (err) {
    console.warn('[Schedules API] Using fallback mock data:', err);
    return mockWorkingSchedules;
  }
}

export async function createSchedule(data) {
  const payload = normalizePayload(data);
  try {
    const response = await apiClient('/schedules', {
      method: 'POST',
      body: payload,
    });
    return response.data;
  } catch (err) {
    console.warn('[Schedules API] createSchedule fallback:', err);
    const newSch = {
      id: `sch-${Date.now()}`,
      _id: `sch-${Date.now()}`,
      name: payload.name,
      type: payload.type,
      days: payload.days,
      workDays: data.workDays || payload.days,
      weeklyHours: data.weeklyHours || data.calculatedWeeklyHours || 40,
      calculatedWeeklyHours: data.weeklyHours || data.calculatedWeeklyHours || 40,
      hoursPerWeek: `${data.weeklyHours || data.calculatedWeeklyHours || 40}h`,
      daysPerWeek: payload.days.length,
      status: payload.status,
    };
    mockWorkingSchedules.push(newSch);
    return newSch;
  }
}

export async function updateSchedule(id, data) {
  const payload = normalizePayload(data);
  try {
    const response = await apiClient(`/schedules/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return response.data;
  } catch (err) {
    console.warn('[Schedules API] updateSchedule fallback:', err);
    const idx = mockWorkingSchedules.findIndex((s) => s.id === id || s._id === id);
    const updated = {
      id: id || `sch-${Date.now()}`,
      _id: id || `sch-${Date.now()}`,
      name: payload.name,
      type: payload.type,
      days: payload.days,
      workDays: data.workDays || payload.days,
      weeklyHours: data.weeklyHours || data.calculatedWeeklyHours || 40,
      calculatedWeeklyHours: data.weeklyHours || data.calculatedWeeklyHours || 40,
      hoursPerWeek: `${data.weeklyHours || data.calculatedWeeklyHours || 40}h`,
      daysPerWeek: payload.days.length,
      status: payload.status,
    };
    if (idx !== -1) {
      mockWorkingSchedules[idx] = { ...mockWorkingSchedules[idx], ...updated };
    } else {
      mockWorkingSchedules.push(updated);
    }
    return updated;
  }
}

