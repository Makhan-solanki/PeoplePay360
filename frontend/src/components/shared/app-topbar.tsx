'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AttendanceWidget } from '@/components/shared/attendance-widget';
import { RoleBadge } from '@/components/shared/role-badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINK_CLASS =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap';

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activePrefix: string | string[];
  items: { label: string; href: string }[];
}

const NAV_GROUPS: (NavGroup | { label: string; icon: React.ComponentType<{ className?: string }>; href: string; activePrefix: string })[] = [
  {
    label: 'Employees',
    icon: Users,
    activePrefix: ['/dashboard/employees', '/dashboard/working-schedules'],
    items: [
      { label: 'All Employees', href: '/dashboard/employees' },
      { label: 'Contracts', href: '/dashboard/contracts' },
      { label: 'Departments', href: '/dashboard/employees/departments' },
      { label: 'Working Schedules', href: '/dashboard/working-schedules' },
    ],
  },
  {
    label: 'Contracts',
    icon: FileText,
    activePrefix: '/dashboard/contracts',
    items: [
      { label: 'All Contracts', href: '/dashboard/contracts' },
      { label: 'New Contract', href: '/dashboard/contracts/new' },
    ],
  },
  {
    label: 'Attendance',
    icon: Clock,
    href: '/dashboard/attendance',
    activePrefix: '/dashboard/attendance',
  },
  {
    label: 'Time Off',
    icon: Calendar,
    activePrefix: '/dashboard/time-off',
    items: [
      { label: 'Dashboard', href: '/dashboard/time-off' },
      { label: 'Time offs', href: '/dashboard/time-off/requests' },
      { label: 'Time off Types', href: '/dashboard/time-off/types' },
      { label: 'Allocations', href: '/dashboard/time-off/allocations' },
    ],
  },
  {
    label: 'Payroll',
    icon: DollarSign,
    activePrefix: '/dashboard/payroll',
    items: [
      { label: 'Dashboard', href: '/dashboard/payroll' },
      { label: 'Payruns', href: '/dashboard/payroll/payruns' },
      { label: 'Payslips', href: '/dashboard/payroll/payslips' },
      { label: 'Structures', href: '/dashboard/payroll/structures' },
      { label: 'Rules', href: '/dashboard/payroll/rules' },
    ],
  },
];

export function AppTopbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (prefix: string | string[]) =>
    Array.isArray(prefix) ? prefix.some((p) => pathname?.startsWith(p)) : pathname?.startsWith(prefix);

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
      <div className="h-16 px-3 sm:px-6 flex items-center gap-2">
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <RoleBadge />
        </div>

        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  NAV_LINK_CLASS,
                  isActive(['/dashboard/employees', '/dashboard/working-schedules'])
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employees</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/employees">All Employees</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/contracts">Contracts</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/employees/departments">Departments</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/working-schedules">Working Schedules</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  NAV_LINK_CLASS,
                  isActive('/dashboard/contracts') ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Contracts</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/contracts">All Contracts</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/contracts/new">New Contract</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/dashboard/attendance"
            className={cn(
              NAV_LINK_CLASS,
              isActive('/dashboard/attendance') ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  NAV_LINK_CLASS,
                  isActive('/dashboard/time-off') ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Time Off</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/time-off">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/time-off/requests">Time offs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/time-off/types">Time off Types</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/time-off/allocations">Allocations</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  NAV_LINK_CLASS,
                  isActive('/dashboard/payroll') ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Payroll</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/payroll">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/payroll/payruns">Payruns</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/payroll/payslips">Payslips</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/payroll/structures">Structures</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/payroll/rules">Rules</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
          <AttendanceWidget />
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-3 pb-3 pt-2 max-h-[calc(100vh-4rem)] overflow-y-auto space-y-3">
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const active = isActive(group.activePrefix);
            if (!('items' in group)) {
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold',
                    active ? 'bg-brand-50 text-brand-600' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {group.label}
                </Link>
              );
            }
            return (
              <div key={group.label} className="space-y-1">
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide',
                    active ? 'text-brand-600' : 'text-slate-400'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {group.label}
                </div>
                <div className="pl-2">
                  {group.items.map((item) => {
                    const itemActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'block px-3 py-2 rounded-xl text-sm font-medium',
                          itemActive ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 px-3">
            <div className="text-xs font-semibold text-slate-900 truncate">{user?.email}</div>
            <div className="text-[10px] text-brand-600 font-medium">{user?.role}</div>
          </div>
        </nav>
      )}
    </header>
  );
}
