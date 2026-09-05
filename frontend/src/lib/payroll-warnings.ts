const WARNING_LABEL: Record<string, string> = {
  MISSING_BANK_DETAILS: 'A/C missing',
  HIGH_DEDUCTIONS: 'High deductions',
};

export function shortWarningLabel(warnings: string[] | null | undefined): string | null {
  if (!warnings || warnings.length === 0) return null;
  const code = warnings[0].split(':')[0].trim();
  return WARNING_LABEL[code] ?? code;
}
