import { z } from 'zod';

export const createPayrunSchema = z.object({
  name: z.string().optional(),
  salaryStructureId: z.string().min(1, 'Salary Structure ID is required'),
  periodStart: z.string().min(1, 'Period start date is required'),
  periodEnd: z.string().min(1, 'Period end date is required'),
  employeeIds: z.array(z.string()).min(1, 'Explicit employee selection is required'),
});
