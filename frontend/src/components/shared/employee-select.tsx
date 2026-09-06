'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  department?: string;
}

interface EmployeeSelectProps {
  employees: EmployeeOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

function labelFor(e: EmployeeOption) {
  return e.department ? `${e.firstName} ${e.lastName} — ${e.department}` : `${e.firstName} ${e.lastName}`;
}

/**
 * A plain <select> becomes unusable once the employee list is large (100+) —
 * the native popup dwarfs the modal it opens in. This is a contained,
 * searchable replacement that behaves the same way (id in, id out).
 */
export function EmployeeSelect({ employees, value, onChange, placeholder = 'Select employee…', className }: EmployeeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = employees.find((e) => e.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => labelFor(e).toLowerCase().includes(q));
  }, [employees, query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        <span className={cn('truncate', !selected && 'text-slate-400')}>
          {selected ? labelFor(selected) : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full h-8 pl-7 pr-2 text-xs rounded-lg border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">No employees found.</div>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onChange(e.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors',
                    e.id === value && 'bg-blue-50 text-blue-700 font-semibold'
                  )}
                >
                  {labelFor(e)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
