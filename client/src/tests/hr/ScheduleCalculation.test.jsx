import { describe, it, expect } from 'vitest';
import { calculateDailyHours, calculateWeeklyTotalHours } from '../../features/schedules/ScheduleEditor';

describe('Working Schedule Hours Computation', () => {
  it('correctly calculates net daily hours with break deduction', () => {
    // 09:00 to 17:30 = 8.5 hours - 30 min break = 8.0 hours
    const hours = calculateDailyHours('09:00', '17:30', 30);
    expect(hours).toBe(8.0);
  });

  it('correctly calculates daily hours with no break', () => {
    const hours = calculateDailyHours('09:00', '13:00', 0);
    expect(hours).toBe(4.0);
  });

  it('returns 0 if end time is before or equal to start time', () => {
    const hours = calculateDailyHours('17:00', '09:00', 0);
    expect(hours).toBe(0);
  });

  it('correctly aggregates weekly total worked hours across Monday-Friday', () => {
    const workDays = [
      { day: 'Monday', isWorkDay: true, startTime: '09:00', endTime: '17:30', breakMinutes: 30 },
      { day: 'Tuesday', isWorkDay: true, startTime: '09:00', endTime: '17:30', breakMinutes: 30 },
      { day: 'Wednesday', isWorkDay: true, startTime: '09:00', endTime: '17:30', breakMinutes: 30 },
      { day: 'Thursday', isWorkDay: true, startTime: '09:00', endTime: '17:30', breakMinutes: 30 },
      { day: 'Friday', isWorkDay: true, startTime: '09:00', endTime: '17:30', breakMinutes: 30 },
      { day: 'Saturday', isWorkDay: false, startTime: '00:00', endTime: '00:00', breakMinutes: 0 },
      { day: 'Sunday', isWorkDay: false, startTime: '00:00', endTime: '00:00', breakMinutes: 0 },
    ];

    const weekly = calculateWeeklyTotalHours(workDays);
    expect(weekly).toBe(40.0);
  });
});
