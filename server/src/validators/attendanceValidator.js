import { z } from 'zod';

export const checkInSchema = z.object({
  employeeId: z.string().optional(),
  checkInTime: z.string().datetime().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().optional(),
  attendanceId: z.string().optional(),
  checkOutTime: z.string().datetime().optional(),
});

export const correctAttendanceSchema = z.object({
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'LATE', 'EXCEPTION']).optional(),
  reason: z.string().min(1, 'Correction reason is required'),
});
