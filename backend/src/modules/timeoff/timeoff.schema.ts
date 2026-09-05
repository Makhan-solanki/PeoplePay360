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

export type CreateTimeOffRequestInput = z.infer<typeof createTimeOffRequestSchema>;
export type RejectTimeOffRequestInput = z.infer<typeof rejectTimeOffRequestSchema>;
