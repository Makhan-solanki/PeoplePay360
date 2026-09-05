import { ContractStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreateContractInput, UpdateContractInput } from './contract.schema';

/**
 * Check if the given date range overlaps with an existing ACTIVE contract for the employee.
 */
export async function assertNoOverlappingActiveContract(
  employeeId: string,
  startDate: Date,
  endDate: Date | null,
  excludeContractId?: string
) {
  const maxDate = new Date('9999-12-31T23:59:59.999Z');
  const targetEnd = endDate ?? maxDate;

  const overlappingContracts = await prisma.contract.findMany({
    where: {
      employeeId,
      status: ContractStatus.ACTIVE,
      ...(excludeContractId ? { id: { not: excludeContractId } } : {}),
    },
  });

  for (const existing of overlappingContracts) {
    const existingStart = existing.startDate;
    const existingEnd = existing.endDate ?? maxDate;

    // Overlap condition: StartA <= EndB AND StartB <= EndA
    if (startDate <= existingEnd && existingStart <= targetEnd) {
      throw new BadRequestError(
        `Contract overlaps with existing active contract "${existing.contractName}" (${existingStart.toISOString().split('T')[0]} to ${existing.endDate ? existing.endDate.toISOString().split('T')[0] : 'Indefinite'})`
      );
    }
  }
}

export async function getAllContracts() {
  return prisma.contract.findMany({
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true },
      },
      salaryStructure: true,
      workingSchedule: true,
    },
    orderBy: { startDate: 'desc' },
  });
}

export async function getContractsByEmployee(employeeId: string) {
  return prisma.contract.findMany({
    where: { employeeId },
    include: { salaryStructure: true, workingSchedule: true },
    orderBy: { startDate: 'desc' },
  });
}

export async function getContractById(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      employee: true,
      salaryStructure: {
        include: { rules: { orderBy: { sequence: 'asc' } } },
      },
      workingSchedule: true,
    },
  });

  if (!contract) {
    throw new NotFoundError(`Contract with ID '${id}' not found`);
  }

  return contract;
}

export async function createContract(data: CreateContractInput) {
  const start = new Date(data.startDate);
  const end = data.endDate ? new Date(data.endDate) : null;

  if (end && end < start) {
    throw new BadRequestError('End date must be after start date');
  }

  if (data.status === 'ACTIVE') {
    await assertNoOverlappingActiveContract(data.employeeId, start, end);
  }

  return prisma.contract.create({
    data: {
      ...data,
      startDate: start,
      endDate: end,
      status: (data.status as ContractStatus) || ContractStatus.ACTIVE,
    },
    include: { salaryStructure: true, workingSchedule: true },
  });
}

export async function updateContract(id: string, data: UpdateContractInput) {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Contract with ID '${id}' not found`);
  }

  const start = data.startDate ? new Date(data.startDate) : existing.startDate;
  const end = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;
  const status = (data.status as ContractStatus) || existing.status;

  if (end && end < start) {
    throw new BadRequestError('End date must be after start date');
  }

  if (status === ContractStatus.ACTIVE) {
    const employeeId = data.employeeId || existing.employeeId;
    await assertNoOverlappingActiveContract(employeeId, start, end, id);
  }

  return prisma.contract.update({
    where: { id },
    data: {
      ...data,
      startDate: start,
      endDate: end,
      status,
    },
    include: { salaryStructure: true, workingSchedule: true },
  });
}
