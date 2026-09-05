import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  calculateDailyHours,
  calculateWeeklyTotalHours,
  parseBreakMinutes,
  ScheduleEditor,
} from '../../features/schedules/ScheduleEditor';
import { createSchedule, updateSchedule } from '../../lib/api/schedules';

describe('Working Schedule Hours Computation', () => {
  it('correctly parses flexible break time formats', () => {
    expect(parseBreakMinutes(60)).toBe(60);
    expect(parseBreakMinutes('1h')).toBe(60);
    expect(parseBreakMinutes('1.5h')).toBe(90);
    expect(parseBreakMinutes('30m')).toBe(30);
    expect(parseBreakMinutes('45min')).toBe(45);
    expect(parseBreakMinutes('0')).toBe(0);
    expect(parseBreakMinutes(null)).toBe(0);
  });

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

  it('renders ScheduleEditor and submits normalized payload with days array', () => {
    const onSaveMock = vi.fn();
    render(<ScheduleEditor onSave={onSaveMock} />);

    const nameInput = screen.getByLabelText(/Schedule Name/i);
    fireEvent.change(nameInput, { target: { value: 'Tech Shift 35h' } });

    const saveButton = screen.getByRole('button', { name: /Save Schedule Definition/i });
    fireEvent.click(saveButton);

    expect(onSaveMock).toHaveBeenCalledTimes(1);
    const saved = onSaveMock.mock.calls[0][0];
    expect(saved.name).toBe('Tech Shift 35h');
    expect(Array.isArray(saved.days)).toBe(true);
    expect(saved.days.length).toBeGreaterThan(0);
    expect(saved.days[0].day).toBe('MON');
    expect(saved.status).toBe('ACTIVE');
  });

  it('createSchedule normalizes data properly when creating a new schedule', async () => {
    const res = await createSchedule({
      name: 'Special Weekend Support',
      workDays: [
        { day: 'Saturday', startTime: '10:00', endTime: '18:00', breakMinutes: '1h' },
        { day: 'Sunday', startTime: '10:00', endTime: '18:00', breakMinutes: '1h' },
      ],
      status: 'Active',
    });

    expect(res).toBeDefined();
    expect(res.name).toBe('Special Weekend Support');
    expect(res.days || res.workDays).toBeDefined();
  });
});

