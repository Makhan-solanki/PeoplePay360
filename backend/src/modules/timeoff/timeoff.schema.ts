import { z } from 'zod';

export const createTimeOffRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  timeOffTypeId: z.string().min(1, 'Time off type ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  totalDays: z.number().positive('Total days must be positive'),
  reason: z.string().optional(),
});

export const rejectTimeOffRequestSchema = z.object({
  rejectionNote: z.string().optional(),
});

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  isPaid: z.boolean().default(true),
});

export const updateTimeOffTypeSchema = createTimeOffTypeSchema.partial();

export const createAllocationSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  timeOffTypeId: z.string().min(1, 'Time off type ID is required'),
  year: z.number().int(),
  allocatedDays: z.number().min(0, 'Allocated days must be zero or more'),
});

export type CreateTimeOffRequestInput = z.infer<typeof createTimeOffRequestSchema>;
export type RejectTimeOffRequestInput = z.infer<typeof rejectTimeOffRequestSchema>;
export type CreateTimeOffTypeInput = z.infer<typeof createTimeOffTypeSchema>;
export type UpdateTimeOffTypeInput = z.infer<typeof updateTimeOffTypeSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
