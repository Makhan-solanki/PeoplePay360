import { z } from 'zod';

export const checkInSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  notes: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
