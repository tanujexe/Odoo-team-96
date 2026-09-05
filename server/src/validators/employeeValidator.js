import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  jobPosition: z.string().optional(),
  jobTitle: z.string().optional(),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  scheduleId: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).optional(),
  // Initial contract section fields
  contractCode: z.string().optional(),
  wage: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional().or(z.literal('')),
  workingSchedule: z.string().optional(),
  salaryStructure: z.string().optional(),
  notes: z.string().optional(),
  contractStatus: z.string().optional(),
  bankDetails: z
    .object({
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      ifscCode: z.string().optional(),
    })
    .optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();
