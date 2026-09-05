import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

const TONE_CLASSES: Record<Tone, string> = {
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-800',
};

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'emerald',
  INACTIVE: 'slate',
  ON_LEAVE: 'amber',
  DRAFT: 'slate',
  CLOSED: 'rose',
  PRESENT: 'emerald',
  ABSENT: 'rose',
  HALF_DAY: 'amber',
  PENDING: 'amber',
  APPROVED: 'emerald',
  REJECTED: 'rose',
  COMPUTED: 'amber',
  VALIDATED: 'blue',
  PAID: 'emerald',
  CONFIRMED: 'blue',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const tone = STATUS_TONE[status] ?? 'blue';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide',
        TONE_CLASSES[tone],
        className
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-emerald-500': tone === 'emerald',
          'bg-amber-500': tone === 'amber',
          'bg-rose-500': tone === 'rose',
          'bg-slate-400': tone === 'slate',
          'bg-blue-500': tone === 'blue',
        })}
      />
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
