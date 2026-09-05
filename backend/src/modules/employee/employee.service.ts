import prisma from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema';

export async function getAllEmployees(filters?: {
  department?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.department) {
    where.department = filters.department;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { jobPosition: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.employee.findMany({
    where,
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
      contracts: {
        where: { status: 'ACTIVE' },
        include: { salaryStructure: true },
        take: 1,
      },
      timeOffBalances: {
        include: { timeOffType: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, role: true } },
      manager: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: true },
      },
      subordinates: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true, jobPosition: true },
      },
      contracts: {
        include: { salaryStructure: true },
        orderBy: { startDate: 'desc' },
      },
      timeOffBalances: {
        include: { timeOffType: true },
      },
      timeOffRequests: {
        include: { timeOffType: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!employee) {
    throw new NotFoundError(`Employee with ID '${id}' not found`);
  }

  return employee;
}

export async function createEmployee(data: CreateEmployeeInput) {
  const existingCode = await prisma.employee.findUnique({
    where: { employeeCode: data.employeeCode },
  });
  if (existingCode) {
    throw new ConflictError(`Employee code '${data.employeeCode}' already in use`);
  }

  const existingEmail = await prisma.employee.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new ConflictError(`Email '${data.email}' already in use`);
  }

  const currentYear = new Date().getFullYear();
  const timeOffTypes = await prisma.timeOffType.findMany();

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        ...data,
      },
    });

    // Auto-create initial default leave balances for the employee
    for (const type of timeOffTypes) {
      const defaultAllocated = type.code === 'AL' ? 20 : type.code === 'SL' ? 10 : 0;
      await tx.timeOffAllocation.create({
        data: {
          employeeId: employee.id,
          timeOffTypeId: type.id,
          year: currentYear,
          allocatedDays: defaultAllocated,
          usedDays: 0,
        },
      });
    }

    return employee;
  });
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    throw new NotFoundError(`Employee with ID '${id}' not found`);
  }

  if (data.email && data.email !== employee.email) {
    const emailExists = await prisma.employee.findUnique({ where: { email: data.email } });
    if (emailExists) {
      throw new ConflictError(`Email '${data.email}' already in use`);
    }
  }

  return prisma.employee.update({
    where: { id },
    data,
  });
}
