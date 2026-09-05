import { z } from 'zod';

export const createPayrunSchema = z.object({
  name: z.string().min(1, 'Payrun name is required'),
  periodStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  periodEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  salaryStructureId: z.string().min(1, 'Salary structure ID is required'),
});

export const generatePayslipsSchema = z.object({
  employeeIds: z.array(z.string()).min(1, 'Select at least one employee'),
});

export const salaryStructureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
export type GeneratePayslipsInput = z.infer<typeof generatePayslipsSchema>;
