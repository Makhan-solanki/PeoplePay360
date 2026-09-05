import { describe, it, expect } from 'vitest';

describe('Contract Period Selection & Overlap Business Rules', () => {
  interface ContractStub {
    id: string;
    employeeId: string;
    startDate: Date;
    endDate: Date | null;
    wage: number;
    status: 'ACTIVE' | 'CLOSED';
  }

  function resolveApplicableContract(
    contracts: ContractStub[],
    periodStart: Date,
    periodEnd: Date
  ): ContractStub | null {
    return (
      contracts.find((c) => {
        if (c.status !== 'ACTIVE') return false;
        const startsBeforePeriodEnds = c.startDate <= periodEnd;
        const endsAfterPeriodStarts = c.endDate === null || c.endDate >= periodStart;
        return startsBeforePeriodEnds && endsAfterPeriodStarts;
      }) || null
    );
  }

  function hasOverlappingActiveContract(
    existingContracts: ContractStub[],
    newStart: Date,
    newEnd: Date | null
  ): boolean {
    const maxDate = new Date('9999-12-31T23:59:59.999Z');
    const targetEnd = newEnd ?? maxDate;

    return existingContracts.some((existing) => {
      if (existing.status !== 'ACTIVE') return false;
      const existingEnd = existing.endDate ?? maxDate;
      return newStart <= existingEnd && existing.startDate <= targetEnd;
    });
  }

  const pastContract: ContractStub = {
    id: 'c-past',
    employeeId: 'emp-1',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    wage: 5000,
    status: 'CLOSED',
  };

  const currentActiveContract: ContractStub = {
    id: 'c-current',
    employeeId: 'emp-1',
    startDate: new Date('2026-01-01'),
    endDate: null,
    wage: 6500,
    status: 'ACTIVE',
  };

  it('selects the correct active contract for current payrun period and ignores past contracts', () => {
    const contracts = [pastContract, currentActiveContract];
    const periodStart = new Date('2026-09-01');
    const periodEnd = new Date('2026-09-30');

    const selected = resolveApplicableContract(contracts, periodStart, periodEnd);
    expect(selected).not.toBeNull();
    expect(selected?.id).toBe('c-current');
    expect(selected?.wage).toBe(6500);
  });

  it('detects and rejects overlapping active contract ranges', () => {
    const existing = [currentActiveContract];

    // Attempting to create a second active contract starting June 2026
    const overlaps = hasOverlappingActiveContract(
      existing,
      new Date('2026-06-01'),
      new Date('2026-12-31')
    );

    expect(overlaps).toBe(true);
  });
});
