import { AttendanceStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CheckInInput, CheckOutInput, UpdateAttendanceInput } from './attendance.schema';

export async function checkIn(data: CheckInInput) {
  const now = new Date();
  const dateStr = data.date || now.toISOString().split('T')[0];
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

  const existing = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: dateObj,
      },
    },
  });

  if (existing && existing.checkIn) {
    throw new BadRequestError(`Employee has already checked in for ${dateStr}`);
  }

  return prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: dateObj,
      },
    },
    update: {
      checkIn: now,
      status: AttendanceStatus.PRESENT,
      notes: data.notes ?? undefined,
    },
    create: {
      employeeId: data.employeeId,
      date: dateObj,
      checkIn: now,
      status: AttendanceStatus.PRESENT,
      notes: data.notes ?? null,
    },
  });
}

export async function checkOut(data: CheckOutInput) {
  const now = new Date();
  const dateStr = data.date || now.toISOString().split('T')[0];
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: dateObj,
      },
    },
  });

  if (!attendance || !attendance.checkIn) {
    throw new BadRequestError(`Cannot check out without an active check-in for ${dateStr}`);
  }

  // Calculate worked hours (rounded to 2 decimal places)
  const diffMs = now.getTime() - attendance.checkIn.getTime();
  const workedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);

  const status = workedHours < 4 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT;

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: now,
      workedHours,
      status,
      notes: data.notes ?? attendance.notes,
    },
  });
}

export async function getAttendances(filters?: {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const where: any = {};

  if (filters?.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) {
      where.date.gte = new Date(`${filters.startDate}T00:00:00.000Z`);
    }
    if (filters.endDate) {
      where.date.lte = new Date(`${filters.endDate}T23:59:59.999Z`);
    }
  }

  return prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getAttendanceById(id: string) {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: true,
          manager: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!attendance) {
    throw new NotFoundError(`Attendance record '${id}' not found`);
  }

  return attendance;
}

/**
 * Manual correction — HR/managers can amend check-in/out timestamps, status, and notes
 * after the fact. Worked hours are re-derived whenever both timestamps are known,
 * never trusted as a raw input.
 */
export async function updateAttendance(id: string, data: UpdateAttendanceInput) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Attendance record '${id}' not found`);
  }

  const checkIn = data.checkIn ? new Date(data.checkIn) : existing.checkIn;
  const checkOut = data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : existing.checkOut;

  if (checkOut && checkOut < checkIn) {
    throw new BadRequestError('Check-out must be after check-in');
  }

  let workedHours = existing.workedHours;
  let status = data.status ? (data.status as AttendanceStatus) : existing.status;

  if (checkOut) {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    workedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    if (!data.status) {
      status = workedHours < 4 ? AttendanceStatus.HALF_DAY : AttendanceStatus.PRESENT;
    }
  }

  return prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours,
      status,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true },
      },
    },
  });
}

export async function getTodayAttendance(employeeId: string) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateObj = new Date(`${todayStr}T00:00:00.000Z`);

  return prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: dateObj,
      },
    },
  });
}
