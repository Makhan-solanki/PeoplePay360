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

export const updateSalaryStructureSchema = salaryStructureSchema.partial();

export const salaryRuleSchema = z
  .object({
    name: z.string().min(1, 'Rule name is required'),
    code: z.string().min(1, 'Code is required'),
    category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']),
    sequence: z.number().int(),
    percentage: z.number().min(0).max(1).nullable().optional(),
    fixedAmount: z.number().nullable().optional(),
    conditionRule: z.string().nullable().optional(),
  })
  .refine((data) => data.percentage != null || data.fixedAmount != null || data.category === 'GROSS' || data.category === 'NET' || data.category === 'BASIC', {
    message: 'Allowance/deduction rules need either a percentage or a fixed amount',
  });

export const updateSalaryRuleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']).optional(),
  sequence: z.number().int().optional(),
  percentage: z.number().min(0).max(1).nullable().optional(),
  fixedAmount: z.number().nullable().optional(),
  conditionRule: z.string().nullable().optional(),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
export type GeneratePayslipsInput = z.infer<typeof generatePayslipsSchema>;
export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>;
export type UpdateSalaryStructureInput = z.infer<typeof updateSalaryStructureSchema>;
export type SalaryRuleInput = z.infer<typeof salaryRuleSchema>;
export type UpdateSalaryRuleInput = z.infer<typeof updateSalaryRuleSchema>;
