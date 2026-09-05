import { z } from 'zod';

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, 'Type name is required'),
  code: z.string().min(1, 'Type code is required'),
  unit: z.enum(['DAYS', 'HOURS']).optional(),
  allocationRequired: z.boolean().optional(),
  approvalWorkflow: z.boolean().optional(),
  payrollIntegration: z.boolean().optional(),
  allowUnpaidOverflow: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createAllocationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  typeId: z.string().min(1, 'Time Off Type ID is required'),
  allocatedAmount: z.number().positive('Allocated amount must be positive'),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  status: z.enum(['DRAFT', 'APPROVED', 'REFUSED']).optional(),
});

export const createRequestSchema = z.object({
  employeeId: z.string().optional(),
  typeId: z.string().min(1, 'Time Off Type ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  duration: z.number().positive().optional(),
  requestUnit: z.enum(['FULL', 'HALF_AM', 'HALF_PM']).optional(),
  description: z.string().optional(),
});
