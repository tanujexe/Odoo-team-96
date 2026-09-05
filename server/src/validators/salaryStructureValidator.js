import { z } from 'zod';

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1, 'Structure name is required'),
  code: z.string().min(1, 'Structure code is required'),
  active: z.boolean().optional(),
});
