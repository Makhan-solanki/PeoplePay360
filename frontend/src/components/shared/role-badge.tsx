'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ROLE_META: Record<string, { abbr: string; classes: string }> = {
  EMPLOYEE: { abbr: 'EMP', classes: 'bg-brand-50 text-brand-700 border-brand-100' },
  HR_MANAGER: { abbr: 'HR', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  HR_PAYROLL_MANAGER: { abbr: 'PAY', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
};
const DEFAULT_META = { abbr: '—', classes: 'bg-slate-50 text-slate-600 border-slate-100' };

export function RoleBadge() {
  const { user, logout } = useAuth();

  if (!user) return null;
  const meta = ROLE_META[user.role] ?? DEFAULT_META;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={user.email}
          className={cn(
            'w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center text-[10px] font-bold tracking-wide transition-transform hover:scale-105',
            meta.classes
          )}
        >
          {meta.abbr}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">{user.email}</div>
          <div className="text-[10px] text-slate-400 font-medium">{user.role.replace(/_/g, ' ')}</div>
        </div>
        <DropdownMenuItem onClick={logout} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
