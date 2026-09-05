import { z } from 'zod';

export const createContractSchema = z.object({
  contractCode: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional().or(z.literal('')),
  wage: z.number().positive('Wage must be a positive number'),
  departmentId: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  salaryStructureId: z.string().nullable().optional(),
  workingSchedule: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
});

export const updateContractSchema = createContractSchema.partial();
