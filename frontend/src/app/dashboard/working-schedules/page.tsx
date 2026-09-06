'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { List as ListIcon, Calendar as CalendarIcon, Search, PlusCircle } from 'lucide-react';

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

interface ScheduleDay {
  day: string;
  hours: number;
}

interface WorkingScheduleRow {
  id: string;
  name: string;
  calendarType: string;
  company: string;
  daysPerWeek: number;
  hoursPerWeek: number;
  status: string;
  days: ScheduleDay[];
}

export default function WorkingSchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<WorkingScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<WorkingScheduleRow[]>('/working-schedules');
        if (res.success && res.data) setSchedules(res.data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter((s) => s.name.toLowerCase().includes(q));
  }, [schedules, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Working Schedules</h1>
          <p className="text-xs text-slate-500">Weekly working patterns used by employees, contracts, attendance and payroll.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => router.push('/dashboard/working-schedules/new')}
            size="sm"
            className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Schedule</span>
          </Button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schedules..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'calendar' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading schedules…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No working schedules found.
        </div>
      ) : view === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Schedule Name</th>
                  <th className="p-3">Days / Week</th>
                  <th className="p-3">Hours / Week</th>
                  <th className="p-3">Company</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/dashboard/working-schedules/${s.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3 text-slate-600">{s.daysPerWeek}</td>
                    <td className="p-3 text-slate-600">{s.hoursPerWeek}h</td>
                    <td className="p-3 text-slate-600">{s.company}</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Schedule</th>
                  {WEEK_DAYS.map((d) => (
                    <th key={d} className="p-3 text-center">{DAY_SHORT[d]}</th>
                  ))}
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const hoursByDay = Object.fromEntries(s.days.map((d) => [d.day, d.hours]));
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/dashboard/working-schedules/${s.id}`)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      {WEEK_DAYS.map((d) => (
                        <td key={d} className="p-3 text-center">
                          {hoursByDay[d] != null ? (
                            <span className="text-brand-600 font-semibold">{hoursByDay[d]}h</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                      <td className="p-3 text-right font-bold text-slate-900">{s.hoursPerWeek}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
