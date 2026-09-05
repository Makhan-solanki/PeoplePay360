import { describe, it, expect } from 'vitest';
import { computeSalaryBreakdown } from '../modules/payroll/payroll.service';

describe('Payroll Engine - Sequential Salary Rule Calculation', () => {
  const sampleRules = [
    {
      code: 'BASIC',
      name: 'Basic Salary',
      category: 'BASIC',
      sequence: 1,
      percentage: null,
      fixedAmount: null,
    },
    {
      code: 'HRA',
      name: 'House Rent Allowance',
      category: 'ALLOWANCE',
      sequence: 2,
      percentage: 0.2, // 20% of Basic = 1200
      fixedAmount: null,
    },
    {
      code: 'TRA',
      name: 'Transport Allowance',
      category: 'ALLOWANCE',
      sequence: 3,
      percentage: null,
      fixedAmount: 200, // Fixed $200
    },
    {
      code: 'GROSS',
      name: 'Gross Salary',
      category: 'GROSS',
      sequence: 4,
      percentage: null,
      fixedAmount: null, // 6000 + 1200 + 200 = 7400
    },
    {
      code: 'PF',
      name: 'Provident Fund',
      category: 'DEDUCTION',
      sequence: 5,
      percentage: 0.12, // 12% of Basic = 720
      fixedAmount: null,
    },
    {
      code: 'TAX',
      name: 'Income Tax',
      category: 'DEDUCTION',
      sequence: 6,
      percentage: 0.1, // 10% of Gross = 740
      fixedAmount: null,
    },
    {
      code: 'NET',
      name: 'Net Salary',
      category: 'NET',
      sequence: 7,
      percentage: null,
      fixedAmount: null, // 7400 - (720 + 740) = 5940
    },
  ];

  it('correctly calculates sequential breakdown for $6,000 base wage', () => {
    const result = computeSalaryBreakdown(6000, sampleRules, {
      bankAccountNo: '123456789',
      bankName: 'Chase',
    });

    expect(result.basicWage).toBe(6000);
    expect(result.grossPay).toBe(7400);
    expect(result.deductions).toBe(1460); // 720 (PF) + 740 (TAX)
    expect(result.netPay).toBe(5940);
    expect(result.warnings.length).toBe(0);

    // Verify all line items are present in sequence
    const basicItem = result.lineItems.find((i) => i.ruleCode === 'BASIC');
    expect(basicItem?.amount).toBe(6000);

    const hraItem = result.lineItems.find((i) => i.ruleCode === 'HRA');
    expect(hraItem?.amount).toBe(1200);

    const traItem = result.lineItems.find((i) => i.ruleCode === 'TRA');
    expect(traItem?.amount).toBe(200);

    const grossItem = result.lineItems.find((i) => i.ruleCode === 'GROSS');
    expect(grossItem?.amount).toBe(7400);

    const pfItem = result.lineItems.find((i) => i.ruleCode === 'PF');
    expect(pfItem?.amount).toBe(720);

    const taxItem = result.lineItems.find((i) => i.ruleCode === 'TAX');
    expect(taxItem?.amount).toBe(740);

    const netItem = result.lineItems.find((i) => i.ruleCode === 'NET');
    expect(netItem?.amount).toBe(5940);
  });

  it('generates a warning when bank details are missing', () => {
    const result = computeSalaryBreakdown(6000, sampleRules, {
      bankAccountNo: null,
      bankName: null,
    });

    expect(result.warnings).toContain(
      'MISSING_BANK_DETAILS: Employee does not have complete bank account information.'
    );
  });
});
