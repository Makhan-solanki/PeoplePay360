'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayAttendance {
  id: string;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  status: string;
}

export function AttendanceWidget() {
  const { user } = useAuth();
  const employeeId = user?.employee?.id ?? null;
  const employeeName = user?.employee?.firstName ?? '';
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadToday = async (empId: string) => {
    const res = await api.get<TodayAttendance | null>(`/attendances/today/${empId}`);
    if (res.success) setToday(res.data);
  };

  useEffect(() => {
    if (employeeId) loadToday(employeeId);
  }, [employeeId]);

  useEffect(() => {
    if (!open || !today || today.checkOut) return;
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [open, today]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isCheckedIn = !!today && !today.checkOut;

  const elapsedLabel = () => {
    if (!today) return '—';
    const start = new Date(today.checkIn).getTime();
    const end = today.checkOut ? new Date(today.checkOut).getTime() : now;
    const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const handleToggle = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const res = isCheckedIn
        ? await api.post('/attendances/check-out', { employeeId })
        : await api.post('/attendances/check-in', { employeeId });
      if (res.success) await loadToday(employeeId);
    } finally {
      setIsLoading(false);
    }
  };

  if (!employeeId) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Attendance"
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
          isCheckedIn ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-rose-50 hover:bg-rose-100'
        )}
      >
        <Fingerprint className={cn('w-4 h-4', isCheckedIn ? 'text-emerald-600' : 'text-rose-500')} />
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
            isCheckedIn ? 'bg-emerald-500' : 'bg-rose-400'
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 p-4 z-50 space-y-3">
          <div>
            <div className="text-[11px] text-slate-400">Welcome back</div>
            <div className="text-sm font-bold text-slate-900">{employeeName}!</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {today ? new Date(today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                {' — '}
                {isCheckedIn
                  ? 'Now'
                  : today?.checkOut
                  ? new Date(today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </span>
              <span className="font-semibold text-slate-900">{elapsedLabel()}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
              <span className="text-slate-500">Today</span>
              <span className="font-semibold text-blue-600">
                {today?.workedHours ? `${today.workedHours}h` : isCheckedIn ? elapsedLabel() : '0h'}
              </span>
            </div>
          </div>

          <Button
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
              'w-full rounded-xl text-xs h-9 font-semibold text-white',
              isCheckedIn ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isLoading ? '…' : isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>
        </div>
      )}
    </div>
  );
}
