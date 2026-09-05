import { z } from 'zod';

const dayLineSchema = z.object({
  day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be in HH:MM format'),
  breakMinutes: z.number().min(0).default(60),
});

export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'FLEXIBLE', 'CUSTOM']).optional(),
  days: z.array(dayLineSchema).min(1, 'At least one working day must be specified'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();
