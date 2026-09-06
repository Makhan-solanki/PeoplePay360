import React from 'react';
import { cn } from '@/lib/utils';

const PALETTE = [
  'bg-brand-50 text-brand-700 border-brand-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
];

function paletteIndex(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % PALETTE.length;
}

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 rounded-lg text-xs',
  md: 'w-12 h-12 rounded-xl text-sm',
  lg: 'w-16 h-16 rounded-2xl text-lg',
};

export function EmployeeAvatar({ firstName, lastName, size = 'md', className }: EmployeeAvatarProps) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  const colorClass = PALETTE[paletteIndex(`${firstName}${lastName}`)];

  return (
    <div
      className={cn(
        'flex items-center justify-center border font-bold shrink-0',
        SIZE_CLASSES[size],
        colorClass,
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}
