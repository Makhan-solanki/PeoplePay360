import React from 'react';
import { cn } from '@/lib/utils';

interface SmartButtonProps {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}

export function SmartButton({ label, count, active, onClick }: SmartButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center px-4 py-1.5 rounded-xl border text-center transition-all min-w-[84px]',
        active
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/40'
      )}
    >
      <span className={cn('text-sm font-bold', active ? 'text-blue-700' : 'text-slate-900')}>{count}</span>
      <span className={cn('text-[10px] font-medium uppercase tracking-wide', active ? 'text-blue-600' : 'text-slate-500')}>
        {label}
      </span>
    </button>
  );
}
