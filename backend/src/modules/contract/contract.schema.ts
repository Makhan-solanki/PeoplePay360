import { z } from 'zod';

export const createContractSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  contractName: z.string().min(1, 'Contract name is required'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  wage: z.number().positive('Wage must be a positive number'),
  department: z.string().min(1, 'Department is required'),
  jobPosition: z.string().min(1, 'Job position is required'),
  salaryStructureId: z.string().min(1, 'Salary structure ID is required'),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).default('ACTIVE'),
});

export const updateContractSchema = createContractSchema.partial();

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
