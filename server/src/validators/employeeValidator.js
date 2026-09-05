import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  name: z.string().min(1, 'Employee name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  jobPosition: z.string().optional(),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  scheduleId: z.string().nullable().optional(),
  bankDetails: z
    .object({
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      ifscCode: z.string().optional(),
    })
    .optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();
