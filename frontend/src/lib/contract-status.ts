const CONTRACT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Running',
  CLOSED: 'Expired',
  DRAFT: 'Draft',
};

export function contractStatusLabel(status: string): string {
  return CONTRACT_STATUS_LABEL[status] ?? status;
}
