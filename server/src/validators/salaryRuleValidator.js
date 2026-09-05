import { z } from 'zod';

export const createSalaryRuleSchema = z
  .object({
    name: z.string().min(1, 'Rule name is required'),
    code: z.string().min(1, 'Rule code is required'),
    salaryStructureId: z.string().min(1, 'Salary Structure ID is required'),
    category: z.preprocess((val) => {
      if (typeof val === 'string') {
        const upper = val.toUpperCase();
        if (upper === 'ALLOWANCE') return 'ALW';
        if (upper === 'DEDUCTION') return 'DED';
        return upper;
      }
      return val;
    }, z.enum(['BASIC', 'ALW', 'GROSS', 'DED', 'NET'])),
    sequence: z.coerce.number().min(1, 'Sequence must be at least 1').default(1),
    computationType: z
      .enum(['FIXED', 'PERCENTAGE', 'FORMULA'])
      .optional(),
    calculationType: z
      .enum(['FIXED', 'PERCENTAGE', 'FORMULA'])
      .optional(),
    fixedAmount: z.coerce.number().min(0).optional(),
    amount: z.coerce.number().min(0).optional(),
    percentage: z.coerce.number().min(0).optional().default(0),
    formula: z.string().optional().default(''),
    active: z.boolean().optional().default(true),
  })
  .transform((data) => {
    const computationType = data.computationType || data.calculationType || 'FIXED';
    const fixedAmount =
      data.fixedAmount !== undefined
        ? data.fixedAmount
        : data.amount !== undefined
        ? data.amount
        : 0;

    return {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      salaryStructureId: data.salaryStructureId,
      category: data.category,
      sequence: data.sequence,
      computationType,
      fixedAmount,
      percentage: data.percentage,
      formula: data.formula || '',
      active: data.active ?? true,
    };
  });

