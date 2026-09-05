import { TimeOffStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreateTimeOffRequestInput, RejectTimeOffRequestInput } from './timeoff.schema';

export async function getTimeOffTypes() {
  return prisma.timeOffType.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getEmployeeAllocations(employeeId: string, year?: number) {
  const targetYear = year || new Date().getFullYear();
  return prisma.timeOffAllocation.findMany({
    where: {
      employeeId,
      year: targetYear,
    },
    include: {
      timeOffType: true,
    },
  });
}

export async function getTimeOffRequests(filters?: {
  employeeId?: string;
  status?: string;
}) {
  const where: any = {};
  if (filters?.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.timeOffRequest.findMany({
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
      timeOffType: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function submitTimeOffRequest(data: CreateTimeOffRequestInput) {
  const start = new Date(`${data.startDate}T00:00:00.000Z`);
  const end = new Date(`${data.endDate}T00:00:00.000Z`);

  if (end < start) {
    throw new BadRequestError('End date must be on or after start date');
  }

  const year = start.getFullYear();

  // Validate that allocation exists and has enough remaining days
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        year,
      },
    },
  });

  if (!allocation) {
    throw new BadRequestError(`No time off allocation found for this year (${year})`);
  }

  const remaining = allocation.allocatedDays - allocation.usedDays;
  if (remaining < data.totalDays) {
    throw new BadRequestError(
      `Insufficient leave balance. Requested: ${data.totalDays} days, Remaining: ${remaining} days`
    );
  }

  return prisma.timeOffRequest.create({
    data: {
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      startDate: start,
      endDate: end,
      totalDays: data.totalDays,
      status: TimeOffStatus.PENDING,
      reason: data.reason ?? null,
    },
    include: {
      timeOffType: true,
      employee: true,
    },
  });
}

/**
 * Approve a Time Off request.
 * Atomically locks and decrements the allocation balance.
 */
export async function approveTimeOffRequest(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeOffRequest.findUnique({
      where: { id: requestId },
      include: { timeOffType: true },
    });

    if (!request) {
      throw new NotFoundError(`Time off request '${requestId}' not found`);
    }

    if (request.status !== TimeOffStatus.PENDING) {
      throw new BadRequestError(`Cannot approve request with status '${request.status}'`);
    }

    const year = request.startDate.getFullYear();

    const allocation = await tx.timeOffAllocation.findUnique({
      where: {
        employeeId_timeOffTypeId_year: {
          employeeId: request.employeeId,
          timeOffTypeId: request.timeOffTypeId,
          year,
        },
      },
    });

    if (!allocation) {
      throw new BadRequestError('Leave allocation record not found for this period');
    }

    const remaining = allocation.allocatedDays - allocation.usedDays;
    if (remaining < request.totalDays) {
      throw new BadRequestError(
        `Cannot approve: Insufficient balance. Remaining: ${remaining} days, Requested: ${request.totalDays} days`
      );
    }

    // Atomically increment usedDays
    await tx.timeOffAllocation.update({
      where: { id: allocation.id },
      data: {
        usedDays: { increment: request.totalDays },
      },
    });

    return tx.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: TimeOffStatus.APPROVED,
      },
      include: {
        timeOffType: true,
        employee: true,
      },
    });
  });
}

export async function rejectTimeOffRequest(requestId: string, input?: RejectTimeOffRequestInput) {
  const request = await prisma.timeOffRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new NotFoundError(`Time off request '${requestId}' not found`);
  }

  if (request.status !== TimeOffStatus.PENDING) {
    throw new BadRequestError(`Cannot reject request with status '${request.status}'`);
  }

  return prisma.timeOffRequest.update({
    where: { id: requestId },
    data: {
      status: TimeOffStatus.REJECTED,
      rejectionNote: input?.rejectionNote ?? null,
    },
    include: {
      timeOffType: true,
      employee: true,
    },
  });
}
