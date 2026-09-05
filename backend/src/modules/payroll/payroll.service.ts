import { PayrunStatus, PayslipStatus, ContractStatus } from '@prisma/client';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreatePayrunInput } from './payroll.schema';

export interface ComputedLineItem {
  ruleCode: string;
  name: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  amount: number;
}

export interface PayslipComputationResult {
  basicWage: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  lineItems: ComputedLineItem[];
  warnings: string[];
}

/**
 * Sequential Salary Rule Calculation Engine
 * 1. BASIC = Contract Wage
 * 2. ALLOWANCES = Computed (Percentage of Basic or Fixed Amount)
 * 3. GROSS = BASIC + SUM(ALLOWANCES)
 * 4. DEDUCTIONS = Computed (Percentage of Gross/Basic or Fixed Amount)
 * 5. NET = GROSS - SUM(DEDUCTIONS)
 */
export function computeSalaryBreakdown(
  wage: number,
  rules: Array<{
    code: string;
    name: string;
    category: string;
    sequence: number;
    percentage: number | null;
    fixedAmount: number | null;
  }>,
  employeeBankDetails?: { bankAccountNo?: string | null; bankName?: string | null }
): PayslipComputationResult {
  const lineItems: ComputedLineItem[] = [];
  const warnings: string[] = [];

  let basicWage = wage;
  let totalAllowances = 0;
  let grossPay = 0;
  let totalDeductions = 0;
  let netPay = 0;

  // Sort rules explicitly by sequence
  const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

  for (const rule of sortedRules) {
    let amount = 0;

    switch (rule.category) {
      case 'BASIC':
        amount = basicWage;
        break;

      case 'ALLOWANCE':
        if (rule.percentage !== null) {
          amount = Math.round(basicWage * rule.percentage * 100) / 100;
        } else if (rule.fixedAmount !== null) {
          amount = rule.fixedAmount;
        }
        totalAllowances += amount;
        break;

      case 'GROSS':
        grossPay = Math.round((basicWage + totalAllowances) * 100) / 100;
        amount = grossPay;
        break;

      case 'DEDUCTION':
        if (rule.percentage !== null) {
          // If code is TAX, compute against GROSS; otherwise against BASIC (e.g. PF)
          const base = rule.code === 'TAX' ? (grossPay || basicWage) : basicWage;
          amount = Math.round(base * rule.percentage * 100) / 100;
        } else if (rule.fixedAmount !== null) {
          amount = rule.fixedAmount;
        }
        totalDeductions += amount;
        break;

      case 'NET':
        netPay = Math.max(0, Math.round((grossPay - totalDeductions) * 100) / 100);
        amount = netPay;
        break;

      default:
        amount = 0;
    }

    lineItems.push({
      ruleCode: rule.code,
      name: rule.name,
      category: rule.category as any,
      amount,
    });
  }

  // Warning checks
  if (!employeeBankDetails?.bankAccountNo || !employeeBankDetails?.bankName) {
    warnings.push('MISSING_BANK_DETAILS: Employee does not have complete bank account information.');
  }

  if (grossPay <= totalDeductions) {
    warnings.push('HIGH_DEDUCTIONS: Deductions exceed or match gross pay.');
  }

  return {
    basicWage,
    grossPay,
    deductions: totalDeductions,
    netPay,
    lineItems,
    warnings,
  };
}

export async function getSalaryStructures() {
  return prisma.salaryStructure.findMany({
    include: {
      rules: { orderBy: { sequence: 'asc' } },
    },
  });
}

export async function createPayrun(data: CreatePayrunInput) {
  const start = new Date(`${data.periodStartDate}T00:00:00.000Z`);
  const end = new Date(`${data.periodEndDate}T00:00:00.000Z`);

  if (end < start) {
    throw new BadRequestError('Period end date must be after period start date');
  }

  return prisma.payrun.create({
    data: {
      name: data.name,
      periodStartDate: start,
      periodEndDate: end,
      salaryStructureId: data.salaryStructureId,
      status: PayrunStatus.DRAFT,
    },
    include: {
      salaryStructure: {
        include: { rules: { orderBy: { sequence: 'asc' } } },
      },
    },
  });
}

export async function getPayruns() {
  return prisma.payrun.findMany({
    include: {
      salaryStructure: true,
      payslips: {
        select: { id: true, netPay: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPayrunById(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: {
        include: { rules: { orderBy: { sequence: 'asc' } } },
      },
      payslips: {
        include: {
          employee: true,
          contract: true,
        },
      },
    },
  });

  if (!payrun) {
    throw new NotFoundError(`Payrun with ID '${id}' not found`);
  }

  return payrun;
}

/**
 * Step 2: Generate draft payslips for eligible employees
 */
export async function generatePayrunPayslips(payrunId: string, employeeIds: string[]) {
  const payrun = await getPayrunById(payrunId);

  if (payrun.status === PayrunStatus.PAID) {
    throw new BadRequestError('Cannot generate payslips for an already PAID payrun');
  }

  const generatedPayslips = [];

  for (const empId of employeeIds) {
    // Find active contract covering this period
    const applicableContract = await prisma.contract.findFirst({
      where: {
        employeeId: empId,
        status: ContractStatus.ACTIVE,
        startDate: { lte: payrun.periodEndDate },
        OR: [
          { endDate: null },
          { endDate: { gte: payrun.periodStartDate } },
        ],
      },
      include: { employee: true },
    });

    if (!applicableContract) {
      continue; // Skip employee without valid contract in period
    }

    const computation = computeSalaryBreakdown(
      applicableContract.wage,
      payrun.salaryStructure.rules,
      {
        bankAccountNo: applicableContract.employee.bankAccountNo,
        bankName: applicableContract.employee.bankName,
      }
    );

    const payslip = await prisma.payslip.upsert({
      where: {
        payrunId_employeeId: {
          payrunId,
          employeeId: empId,
        },
      },
      update: {
        contractId: applicableContract.id,
        basicWage: computation.basicWage,
        grossPay: computation.grossPay,
        deductions: computation.deductions,
        netPay: computation.netPay,
        lineItems: computation.lineItems as any,
        warnings: computation.warnings as any,
        status: PayslipStatus.COMPUTED,
      },
      create: {
        payrunId,
        employeeId: empId,
        contractId: applicableContract.id,
        basicWage: computation.basicWage,
        grossPay: computation.grossPay,
        deductions: computation.deductions,
        netPay: computation.netPay,
        lineItems: computation.lineItems as any,
        warnings: computation.warnings as any,
        status: PayslipStatus.COMPUTED,
      },
    });

    generatedPayslips.push(payslip);
  }

  // Re-aggregate payrun totals
  const allPayslips = await prisma.payslip.findMany({ where: { payrunId } });
  const totalGross = allPayslips.reduce((acc, curr) => acc + curr.grossPay, 0);
  const totalDeductions = allPayslips.reduce((acc, curr) => acc + curr.deductions, 0);
  const totalNet = allPayslips.reduce((acc, curr) => acc + curr.netPay, 0);

  await prisma.payrun.update({
    where: { id: payrunId },
    data: {
      totalGross,
      totalDeductions,
      totalNet,
      status: PayrunStatus.COMPUTED,
    },
  });

  return getPayrunById(payrunId);
}

/**
 * Recompute all payslips in a payrun
 */
export async function computePayrun(payrunId: string) {
  const payrun = await getPayrunById(payrunId);
  const employeeIds = payrun.payslips.map((p) => p.employeeId);
  return generatePayrunPayslips(payrunId, employeeIds);
}

/**
 * Validate payrun: check for critical warnings and transition status to VALIDATED
 */
export async function validatePayrun(payrunId: string) {
  const payrun = await getPayrunById(payrunId);

  if (payrun.payslips.length === 0) {
    throw new BadRequestError('Cannot validate payrun with 0 payslips');
  }

  // Collect company-wide payrun warnings
  const warnings: string[] = [];
  let hasMissingBankDetails = false;

  for (const slip of payrun.payslips) {
    if (!slip.employee.bankAccountNo) {
      hasMissingBankDetails = true;
    }
  }

  if (hasMissingBankDetails) {
    warnings.push('WARNING: One or more employees are missing bank details.');
  }

  return prisma.payrun.update({
    where: { id: payrunId },
    data: {
      status: PayrunStatus.VALIDATED,
      warnings: warnings as any,
    },
    include: {
      salaryStructure: true,
      payslips: { include: { employee: true, contract: true } },
    },
  });
}

/**
 * Mark payrun as PAID
 */
export async function markPayrunPaid(payrunId: string) {
  const payrun = await getPayrunById(payrunId);

  if (payrun.status !== PayrunStatus.VALIDATED && payrun.status !== PayrunStatus.COMPUTED) {
    throw new BadRequestError('Payrun must be COMPUTED or VALIDATED before marking as PAID');
  }

  return prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId },
      data: { status: PayslipStatus.PAID },
    });

    return tx.payrun.update({
      where: { id: payrunId },
      data: { status: PayrunStatus.PAID },
      include: {
        salaryStructure: true,
        payslips: { include: { employee: true, contract: true } },
      },
    });
  });
}

export async function getPayslipById(id: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      employee: true,
      contract: {
        include: { salaryStructure: true },
      },
      payrun: {
        include: { salaryStructure: true },
      },
    },
  });

  if (!payslip) {
    throw new NotFoundError(`Payslip with ID '${id}' not found`);
  }

  return payslip;
}
