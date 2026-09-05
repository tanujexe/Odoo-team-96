import { apiClient } from './client';
import { mockWorkingSchedules } from './mockData';

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
  try {
    const response = await apiClient('/schedules', {
      method: 'POST',
      body: data,
    });
    return response.data;
  } catch (err) {
    const newSch = {
      id: `sch-${Date.now()}`,
      name: data.name || 'Custom Schedule',
      workDays: data.workDays || [],
      calculatedWeeklyHours: data.calculatedWeeklyHours || 40,
    };
    mockWorkingSchedules.push(newSch);
    return newSch;
  }
}
