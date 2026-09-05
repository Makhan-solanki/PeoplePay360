import { z } from 'zod';

export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const workingScheduleDaySchema = z.object({
  day: z.enum(WEEK_DAYS),
  startTime: z.string().regex(TIME_REGEX, 'startTime must be in HH:MM 24h format'),
  endTime: z.string().regex(TIME_REGEX, 'endTime must be in HH:MM 24h format'),
  breakMinutes: z.number().min(0).default(0),
});

export const createWorkingScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  calendarType: z.string().default('Standard'),
  company: z.string().default('My Company'),
  timezone: z.string().default('Company Timezone'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  days: z.array(workingScheduleDaySchema).min(1, 'At least one working day is required'),
});

export const updateWorkingScheduleSchema = createWorkingScheduleSchema.partial();

export type WorkingScheduleDayInput = z.infer<typeof workingScheduleDaySchema>;
export type CreateWorkingScheduleInput = z.infer<typeof createWorkingScheduleSchema>;
export type UpdateWorkingScheduleInput = z.infer<typeof updateWorkingScheduleSchema>;
