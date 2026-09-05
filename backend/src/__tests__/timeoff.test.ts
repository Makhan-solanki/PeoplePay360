import { describe, it, expect } from 'vitest';

describe('Time Off Allocation & Atomic Balance Business Rules', () => {
  interface AllocationStub {
    id: string;
    employeeId: string;
    timeOffTypeId: string;
    year: number;
    allocatedDays: number;
    usedDays: number;
  }

  function deductBalance(allocation: AllocationStub, requestedDays: number): AllocationStub {
    const remaining = allocation.allocatedDays - allocation.usedDays;
    if (remaining < requestedDays) {
      throw new Error(`Insufficient leave balance: Requested ${requestedDays}, Remaining ${remaining}`);
    }
    return {
      ...allocation,
      usedDays: allocation.usedDays + requestedDays,
    };
  }

  it('deducts remaining days accurately upon approval', () => {
    const allocation: AllocationStub = {
      id: 'alloc-1',
      employeeId: 'emp-1',
      timeOffTypeId: 'type-al',
      year: 2026,
      allocatedDays: 20,
      usedDays: 2,
    };

    const updated = deductBalance(allocation, 3);
    expect(updated.usedDays).toBe(5);
    expect(updated.allocatedDays - updated.usedDays).toBe(15);
  });

  it('throws error when requested days exceed available allocation balance', () => {
    const allocation: AllocationStub = {
      id: 'alloc-1',
      employeeId: 'emp-1',
      timeOffTypeId: 'type-al',
      year: 2026,
      allocatedDays: 10,
      usedDays: 8,
    };

    expect(() => deductBalance(allocation, 5)).toThrowError(/Insufficient leave balance/);
  });
});
