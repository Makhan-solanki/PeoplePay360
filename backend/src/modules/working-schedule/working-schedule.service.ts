import prisma from '../../lib/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors';
import {
  CreateWorkingScheduleInput,
  UpdateWorkingScheduleInput,
  WorkingScheduleDayInput,
} from './working-schedule.schema';

/**
 * Weekly hours are always derived from the day rows — never trusted from client input.
 */
function computeDayHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  let rawMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  // Overnight shift (e.g. 22:00 -> 06:00) wraps past midnight.
  if (rawMinutes <= 0) {
    rawMinutes += 24 * 60;
  }

  if (rawMinutes <= breakMinutes) {
    throw new BadRequestError(`Break time cannot exceed the shift length (got ${startTime}–${endTime})`);
  }

  const netMinutes = rawMinutes - breakMinutes;
  return Math.round((netMinutes / 60) * 100) / 100;
}

function buildDaysData(days: WorkingScheduleDayInput[]) {
  return days.map((d) => ({
    day: d.day,
    startTime: d.startTime,
    endTime: d.endTime,
    breakMinutes: d.breakMinutes ?? 0,
    hours: computeDayHours(d.startTime, d.endTime, d.breakMinutes ?? 0),
  }));
}

export async function getAllWorkingSchedules() {
  return prisma.workingSchedule.findMany({
    include: {
      days: { orderBy: { id: 'asc' } },
      _count: { select: { employees: true, contracts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWorkingScheduleById(id: string) {
  const schedule = await prisma.workingSchedule.findUnique({
    where: { id },
    include: { days: { orderBy: { id: 'asc' } } },
  });

  if (!schedule) {
    throw new NotFoundError(`Working schedule with ID '${id}' not found`);
  }

  return schedule;
}

export async function createWorkingSchedule(data: CreateWorkingScheduleInput) {
  const existing = await prisma.workingSchedule.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ConflictError(`Working schedule '${data.name}' already exists`);
  }

  const daysData = buildDaysData(data.days);
  const hoursPerWeek = Math.round(daysData.reduce((sum, d) => sum + d.hours, 0) * 100) / 100;

  return prisma.workingSchedule.create({
    data: {
      name: data.name,
      calendarType: data.calendarType,
      company: data.company,
      timezone: data.timezone,
      status: data.status,
      daysPerWeek: daysData.length,
      hoursPerWeek,
      days: { create: daysData },
    },
    include: { days: { orderBy: { id: 'asc' } } },
  });
}

export async function updateWorkingSchedule(id: string, data: UpdateWorkingScheduleInput) {
  const existing = await prisma.workingSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Working schedule with ID '${id}' not found`);
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.workingSchedule.findUnique({ where: { name: data.name } });
    if (nameTaken) {
      throw new ConflictError(`Working schedule '${data.name}' already exists`);
    }
  }

  return prisma.$transaction(async (tx) => {
    let daysPerWeek = existing.daysPerWeek;
    let hoursPerWeek = existing.hoursPerWeek;

    if (data.days) {
      const daysData = buildDaysData(data.days);
      hoursPerWeek = Math.round(daysData.reduce((sum, d) => sum + d.hours, 0) * 100) / 100;
      daysPerWeek = daysData.length;

      await tx.workingScheduleDay.deleteMany({ where: { workingScheduleId: id } });
      await tx.workingScheduleDay.createMany({
        data: daysData.map((d) => ({ ...d, workingScheduleId: id })),
      });
    }

    return tx.workingSchedule.update({
      where: { id },
      data: {
        name: data.name,
        calendarType: data.calendarType,
        company: data.company,
        timezone: data.timezone,
        status: data.status,
        daysPerWeek,
        hoursPerWeek,
      },
      include: { days: { orderBy: { id: 'asc' } } },
    });
  });
}
