import { z } from 'zod';

export const createContractSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  wage: z.number().positive('Wage must be a positive number'),
  departmentId: z.string().min(1, 'Department ID is required'),
  position: z.string().min(1, 'Position is required'),
  salaryStructureId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
});

export const updateContractSchema = createContractSchema.partial();
