'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Fingerprint, X } from 'lucide-react';
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
  const [actionError, setActionError] = useState<string | null>(null);

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

  const handleOpen = () => {
    setActionError(null);
    if (employeeId) loadToday(employeeId);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleToggle = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setActionError(null);
    try {
      const res = isCheckedIn
        ? await api.post('/attendances/check-out', { employeeId })
        : await api.post('/attendances/check-in', { employeeId });
      if (res.success) {
        await loadToday(employeeId);
      } else {
        setActionError(res.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setActionError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Attendance"
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
          !employeeId
            ? 'bg-slate-100 hover:bg-slate-200'
            : isCheckedIn
            ? 'bg-emerald-50 hover:bg-emerald-100'
            : 'bg-rose-50 hover:bg-rose-100'
        )}
      >
        <Fingerprint
          className={cn(
            'w-4 h-4',
            !employeeId ? 'text-slate-400' : isCheckedIn ? 'text-emerald-600' : 'text-rose-500'
          )}
        />
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
            !employeeId ? 'bg-slate-300' : isCheckedIn ? 'bg-emerald-500' : 'bg-rose-400'
          )}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              {employeeId ? (
                <div>
                  <div className="text-xs text-slate-400">Welcome back</div>
                  <div className="text-lg font-bold text-slate-900">{employeeName}!</div>
                </div>
              ) : (
                <div className="text-base font-bold text-slate-900">Attendance</div>
              )}
              <button
                onClick={handleClose}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-700 -mt-1 -mr-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!employeeId ? (
              <div className="text-sm text-slate-500">
                No employee record is linked to this account, so there&apos;s no attendance to track here.
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
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
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Today</span>
                    <span className="font-semibold text-blue-600">
                      {today?.workedHours ? `${today.workedHours}h` : isCheckedIn ? elapsedLabel() : '0h'}
                    </span>
                  </div>
                </div>

                {actionError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    {actionError}
                  </div>
                )}

                <Button
                  onClick={handleToggle}
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-xl text-sm h-11 font-semibold text-white',
                    isCheckedIn ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {isLoading ? '…' : isCheckedIn ? 'Check Out' : 'Check In'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
