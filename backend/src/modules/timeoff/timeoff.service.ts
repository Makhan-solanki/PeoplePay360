import { TimeOffStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors';
import {
  CreateTimeOffRequestInput,
  RejectTimeOffRequestInput,
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  CreateAllocationInput,
} from './timeoff.schema';

export async function getTimeOffTypes() {
  return prisma.timeOffType.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createTimeOffType(data: CreateTimeOffTypeInput) {
  const existing = await prisma.timeOffType.findFirst({
    where: { OR: [{ name: data.name }, { code: data.code }] },
  });
  if (existing) {
    throw new ConflictError('A time off type with this name or code already exists');
  }

  return prisma.timeOffType.create({ data });
}

export async function updateTimeOffType(id: string, data: UpdateTimeOffTypeInput) {
  const existing = await prisma.timeOffType.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Time off type '${id}' not found`);
  }

  if (data.name || data.code) {
    const clash = await prisma.timeOffType.findFirst({
      where: {
        id: { not: id },
        OR: [...(data.name ? [{ name: data.name }] : []), ...(data.code ? [{ code: data.code }] : [])],
      },
    });
    if (clash) {
      throw new ConflictError('A time off type with this name or code already exists');
    }
  }

  return prisma.timeOffType.update({ where: { id }, data });
}

/**
 * Manually create or top up an employee's leave balance for a given year.
 * If an allocation already exists for that employee/type/year, its allocatedDays
 * is replaced (not summed) — this is a correction tool, not an accrual ledger.
 */
export async function createAllocation(data: CreateAllocationInput) {
  const [employee, type] = await Promise.all([
    prisma.employee.findUnique({ where: { id: data.employeeId } }),
    prisma.timeOffType.findUnique({ where: { id: data.timeOffTypeId } }),
  ]);
  if (!employee) throw new NotFoundError(`Employee '${data.employeeId}' not found`);
  if (!type) throw new NotFoundError(`Time off type '${data.timeOffTypeId}' not found`);

  return prisma.timeOffAllocation.upsert({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        year: data.year,
      },
    },
    update: { allocatedDays: data.allocatedDays },
    create: {
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      year: data.year,
      allocatedDays: data.allocatedDays,
      usedDays: 0,
    },
    include: { timeOffType: true },
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
      decidedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
    },
  });
}

/**
 * Approve or refuse an allocation. Allocations take effect immediately on
 * creation (see createAllocation), so this acts as a live status toggle/
 * correction rather than a one-time PENDING gate — a REJECTED allocation no
 * longer counts as available balance for new or approved time off requests.
 */
export async function decideAllocation(
  allocationId: string,
  decidedById: string,
  decision: typeof TimeOffStatus.APPROVED | typeof TimeOffStatus.REJECTED
) {
  const allocation = await prisma.timeOffAllocation.findUnique({ where: { id: allocationId } });
  if (!allocation) {
    throw new NotFoundError(`Allocation '${allocationId}' not found`);
  }

  return prisma.timeOffAllocation.update({
    where: { id: allocationId },
    data: {
      status: decision,
      decidedById,
      decidedAt: new Date(),
    },
    include: {
      timeOffType: true,
      decidedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
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
      decidedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
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

  // Validate that an approved allocation exists and has enough remaining days
  const allocation = await prisma.timeOffAllocation.findUnique({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        year,
      },
    },
  });

  if (!allocation || allocation.status !== TimeOffStatus.APPROVED) {
    throw new BadRequestError(`No approved time off allocation found for this year (${year})`);
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
export async function approveTimeOffRequest(requestId: string, decidedById: string) {
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

    if (!allocation || allocation.status !== TimeOffStatus.APPROVED) {
      throw new BadRequestError('No approved leave allocation record found for this period');
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
        decidedById,
        decidedAt: new Date(),
      },
      include: {
        timeOffType: true,
        employee: true,
        decidedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
      },
    });
  });
}

export async function rejectTimeOffRequest(requestId: string, decidedById: string, input?: RejectTimeOffRequestInput) {
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
      decidedById,
      decidedAt: new Date(),
    },
    include: {
      timeOffType: true,
      employee: true,
      decidedBy: { select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } } },
    },
  });
}
