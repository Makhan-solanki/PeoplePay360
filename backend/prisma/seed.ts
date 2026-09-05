import { PrismaClient, Role, ContractStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PeoplePay360 database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users (HR Payroll Manager, HR Manager, Employee)
  const payrollManagerUser = await prisma.user.upsert({
    where: { email: 'payroll@peoplepay360.com' },
    update: {},
    create: {
      email: 'payroll@peoplepay360.com',
      password: passwordHash,
      role: Role.HR_PAYROLL_MANAGER,
    },
  });

  const hrManagerUser = await prisma.user.upsert({
    where: { email: 'hr@peoplepay360.com' },
    update: {},
    create: {
      email: 'hr@peoplepay360.com',
      password: passwordHash,
      role: Role.HR_MANAGER,
    },
  });

  const empUser1 = await prisma.user.upsert({
    where: { email: 'john.doe@peoplepay360.com' },
    update: {},
    create: {
      email: 'john.doe@peoplepay360.com',
      password: passwordHash,
      role: Role.EMPLOYEE,
    },
  });

  const empUser2 = await prisma.user.upsert({
    where: { email: 'jane.smith@peoplepay360.com' },
    update: {},
    create: {
      email: 'jane.smith@peoplepay360.com',
      password: passwordHash,
      role: Role.EMPLOYEE,
    },
  });

  // 2. Seed Salary Structure & Rules
  const regularSalaryStructure = await prisma.salaryStructure.upsert({
    where: { code: 'REGULAR' },
    update: {},
    create: {
      name: 'Regular Salary Structure',
      code: 'REGULAR',
      description: 'Standard full-time employee salary structure with HRA, Transport, PF & Tax.',
    },
  });

  // Clean old rules if any and insert standard sequenced rules
  await prisma.salaryRule.deleteMany({
    where: { salaryStructureId: regularSalaryStructure.id },
  });

  await prisma.salaryRule.createMany({
    data: [
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'BASIC',
        sequence: 1,
        percentage: null,
        fixedAmount: null, // Derived dynamically from contract wage
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'House Rent Allowance (HRA)',
        code: 'HRA',
        category: 'ALLOWANCE',
        sequence: 2,
        percentage: 0.20, // 20% of Basic
        fixedAmount: null,
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Transport Allowance',
        code: 'TRA',
        category: 'ALLOWANCE',
        sequence: 3,
        percentage: null,
        fixedAmount: 200, // Fixed $200
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Gross Salary',
        code: 'GROSS',
        category: 'GROSS',
        sequence: 4,
        percentage: null,
        fixedAmount: null, // BASIC + HRA + TRA
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Provident Fund (PF)',
        code: 'PF',
        category: 'DEDUCTION',
        sequence: 5,
        percentage: 0.12, // 12% of Basic
        fixedAmount: null,
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Income Tax',
        code: 'TAX',
        category: 'DEDUCTION',
        sequence: 6,
        percentage: 0.10, // 10% of Gross
        fixedAmount: null,
      },
      {
        salaryStructureId: regularSalaryStructure.id,
        name: 'Net Salary',
        code: 'NET',
        category: 'NET',
        sequence: 7,
        percentage: null,
        fixedAmount: null, // GROSS - Deductions
      },
    ],
  });

  // 3. Seed Time Off Types
  const annualLeaveType = await prisma.timeOffType.upsert({
    where: { code: 'AL' },
    update: {},
    create: {
      name: 'Annual Leave',
      code: 'AL',
      isPaid: true,
    },
  });

  const sickLeaveType = await prisma.timeOffType.upsert({
    where: { code: 'SL' },
    update: {},
    create: {
      name: 'Sick Leave',
      code: 'SL',
      isPaid: true,
    },
  });

  const unpaidLeaveType = await prisma.timeOffType.upsert({
    where: { code: 'UL' },
    update: {},
    create: {
      name: 'Unpaid Leave',
      code: 'UL',
      isPaid: false,
    },
  });

  // 4. Seed Employees
  const emp1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP001' },
    update: {},
    create: {
      userId: empUser1.id,
      employeeCode: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@peoplepay360.com',
      phone: '+1 555-0101',
      department: 'Engineering',
      jobPosition: 'Senior Software Engineer',
      workingSchedule: 'Standard 40h/week',
      status: 'ACTIVE',
      bankName: 'Chase Bank',
      bankAccountNo: '1234567890',
      bankRoutingNo: '021000021',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP002' },
    update: {},
    create: {
      userId: empUser2.id,
      employeeCode: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@peoplepay360.com',
      phone: '+1 555-0102',
      department: 'Product',
      jobPosition: 'Product Manager',
      workingSchedule: 'Standard 40h/week',
      status: 'ACTIVE',
      bankName: 'Silicon Valley Bank',
      bankAccountNo: '9876543210',
      bankRoutingNo: '121000358',
    },
  });

  // 5. Seed Contracts for Employees
  const currentYear = new Date().getFullYear();

  // Employee 1 Active Contract
  await prisma.contract.upsert({
    where: { id: 'contract-emp-001' },
    update: {},
    create: {
      id: 'contract-emp-001',
      employeeId: emp1.id,
      contractName: 'Full-Time Software Engineer Contract',
      startDate: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      endDate: null, // Open-ended
      wage: 6000,    // $6,000/mo base
      department: 'Engineering',
      jobPosition: 'Senior Software Engineer',
      salaryStructureId: regularSalaryStructure.id,
      status: ContractStatus.ACTIVE,
    },
  });

  // Employee 2 Active Contract
  await prisma.contract.upsert({
    where: { id: 'contract-emp-002' },
    update: {},
    create: {
      id: 'contract-emp-002',
      employeeId: emp2.id,
      contractName: 'Full-Time Product Manager Contract',
      startDate: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      endDate: null,
      wage: 7500,    // $7,500/mo base
      department: 'Product',
      jobPosition: 'Product Manager',
      salaryStructureId: regularSalaryStructure.id,
      status: ContractStatus.ACTIVE,
    },
  });

  // 6. Seed Time Off Allocations for Current Year
  await prisma.timeOffAllocation.upsert({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: emp1.id,
        timeOffTypeId: annualLeaveType.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      employeeId: emp1.id,
      timeOffTypeId: annualLeaveType.id,
      year: currentYear,
      allocatedDays: 20,
      usedDays: 2,
    },
  });

  await prisma.timeOffAllocation.upsert({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: emp1.id,
        timeOffTypeId: sickLeaveType.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      employeeId: emp1.id,
      timeOffTypeId: sickLeaveType.id,
      year: currentYear,
      allocatedDays: 10,
      usedDays: 0,
    },
  });

  await prisma.timeOffAllocation.upsert({
    where: {
      employeeId_timeOffTypeId_year: {
        employeeId: emp2.id,
        timeOffTypeId: annualLeaveType.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      employeeId: emp2.id,
      timeOffTypeId: annualLeaveType.id,
      year: currentYear,
      allocatedDays: 20,
      usedDays: 5,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--- Default Accounts ---');
  console.log('HR Payroll Manager: payroll@peoplepay360.com / Password123!');
  console.log('HR Manager:         hr@peoplepay360.com / Password123!');
  console.log('Employee:           john.doe@peoplepay360.com / Password123!');
  console.log('Employee:           jane.smith@peoplepay360.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
