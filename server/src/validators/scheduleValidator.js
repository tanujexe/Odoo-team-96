import { z } from 'zod';

const dayCodeEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    const map = {
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
    return map[lower] || val.toUpperCase();
  }
  return val;
}, z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']));

const breakMinutesSchema = z.preprocess((val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const str = val.trim().toLowerCase();
    if (str.endsWith('h')) {
      const hours = parseFloat(str.replace('h', ''));
      return isNaN(hours) ? 0 : Math.round(hours * 60);
    }
    if (str.endsWith('m') || str.endsWith('min')) {
      const mins = parseFloat(str.replace(/[^\d.]/g, ''));
      return isNaN(mins) ? 0 : Math.round(mins);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }
  return val ?? 60;
}, z.number().min(0).default(60));

const dayLineSchema = z.object({
  day: dayCodeEnum,
  startTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'startTime must be in HH:MM format'),
  endTime: z.string().regex(/^\d{1,2}:\d{2}$/, 'endTime must be in HH:MM format'),
  breakMinutes: breakMinutesSchema.optional().default(60),
});

const statusEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.enum(['ACTIVE', 'INACTIVE']).optional()
);

export const createScheduleSchema = z.preprocess(
  (input) => {
    if (input && typeof input === 'object') {
      const rawDays = input.days || input.workDays;
      if (Array.isArray(rawDays)) {
        const filtered = rawDays.filter((d) => d && d.isWorkDay !== false);
        return { ...input, days: filtered };
      }
    }
    return input;
  },
  z.object({
    name: z.string().min(1, 'Schedule name is required'),
    type: z.enum(['FULL_TIME', 'PART_TIME', 'FLEXIBLE', 'CUSTOM']).optional(),
    days: z.array(dayLineSchema).min(1, 'At least one working day must be specified'),
    status: statusEnum,
  })
);

export const updateScheduleSchema = z.preprocess(
  (input) => {
    if (input && typeof input === 'object') {
      const rawDays = input.days || input.workDays;
      if (Array.isArray(rawDays)) {
        const filtered = rawDays.filter((d) => d && d.isWorkDay !== false);
        return { ...input, days: filtered };
      }
    }
    return input;
  },
  createScheduleSchema.partial()
);

