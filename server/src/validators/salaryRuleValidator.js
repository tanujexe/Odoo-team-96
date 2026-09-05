import { z } from 'zod';

export const createSalaryRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().min(1, 'Rule code is required'),
  salaryStructureId: z.string().min(1, 'Salary Structure ID is required'),
  category: z.enum(['BASIC', 'ALW', 'GROSS', 'DED', 'NET']),
  sequence: z.number().min(1, 'Sequence must be at least 1'),
  computationType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
  fixedAmount: z.number().min(0).optional(),
  percentage: z.number().min(0).optional(),
  formula: z.string().optional(),
  active: z.boolean().optional(),
});
