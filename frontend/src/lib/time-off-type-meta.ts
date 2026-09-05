interface TimeOffTypeLike {
  code: string;
  isPaid: boolean;
}

const COLOR_BY_CODE: Record<string, string> = {
  AL: 'Blue',
  SL: 'Amber',
  UL: 'Slate',
};

/**
 * The current schema only stores { name, code, isPaid }. These fields are reasonable,
 * non-fabricated projections of that data for the richer Type form the UI mockup expects —
 * not independently stored yet. Persisting them for real is a backend follow-up.
 */
export function timeOffTypeMeta(type: TimeOffTypeLike) {
  return {
    unit: 'Days',
    requiresAllocation: type.isPaid ? 'Required' : 'No',
    approval: 'Manager',
    status: 'Active',
    payrollWorkEntry: type.isPaid ? 'Paid Work Entry' : 'Unpaid Leave Entry',
    displayColor: COLOR_BY_CODE[type.code] ?? 'Blue',
  };
}
