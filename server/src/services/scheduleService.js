import { WorkingSchedule } from '../models/WorkingSchedule.js';

/**
 * Calculates net hours for a single day line: (endTime - startTime) - breakMinutes
 * @param {string} startTime - e.g. "08:30"
 * @param {string} endTime - e.g. "17:00"
 * @param {number} breakMinutes - e.g. 60
 * @returns {number} hours
 */
export function calculateDayHours(startTime, endTime, breakMinutes = 60) {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startTotalM = startH * 60 + startM;
  const endTotalM = endH * 60 + endM;

  const grossM = endTotalM - startTotalM;
  const netM = Math.max(0, grossM - breakMinutes);

  return Number((netM / 60).toFixed(2));
}

/**
 * Calculates total weekly hours from an array of day schedule lines.
 * @param {Array<{ startTime: string, endTime: string, breakMinutes?: number }>} days
 * @returns {number} total weekly hours
 */
export function calculateWeeklyHours(days = []) {
  return days.reduce((total, day) => {
    return total + calculateDayHours(day.startTime, day.endTime, day.breakMinutes || 0);
  }, 0);
}

export async function createSchedule(data) {
  const calculatedWeekly = calculateWeeklyHours(data.days || []);
  const schedule = new WorkingSchedule({
    ...data,
    weeklyHours: calculatedWeekly,
  });
  await schedule.save();
  return schedule;
}

export async function updateSchedule(id, data) {
  let updateData = { ...data };
  if (data.days) {
    updateData.weeklyHours = calculateWeeklyHours(data.days);
  }
  const schedule = await WorkingSchedule.findByIdAndUpdate(id, updateData, { new: true });
  if (!schedule) {
    const err = new Error('Schedule not found');
    err.code = 'SCHEDULE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return schedule;
}

export async function getSchedules(filter = {}, pagination = {}) {
  const page = parseInt(pagination.page || 1, 10);
  const pageSize = parseInt(pagination.pageSize || 20, 10);
  const skip = (page - 1) * pageSize;

  const [schedules, total] = await Promise.all([
    WorkingSchedule.find(filter).skip(skip).limit(pageSize).sort({ name: 1 }),
    WorkingSchedule.countDocuments(filter),
  ]);

  return { schedules, meta: { page, pageSize, total } };
}

export async function getScheduleById(id) {
  const schedule = await WorkingSchedule.findById(id);
  if (!schedule) {
    const err = new Error('Schedule not found');
    err.code = 'SCHEDULE_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }
  return schedule;
}
