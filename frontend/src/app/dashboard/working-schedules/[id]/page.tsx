'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Check, X, Pencil, Plus, Trash2 } from 'lucide-react';

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

interface DayRow {
  day: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

interface WorkingScheduleDetail {
  id: string;
  name: string;
  calendarType: string;
  company: string;
  timezone: string;
  status: string;
  daysPerWeek: number;
  hoursPerWeek: number;
  days: DayRow[];
}

function computeDayHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let raw = eh * 60 + em - (sh * 60 + sm);
  if (raw <= 0) raw += 24 * 60;
  const net = Math.max(0, raw - breakMinutes);
  return Math.round((net / 60) * 100) / 100;
}

export default function WorkingScheduleFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const [schedule, setSchedule] = useState<WorkingScheduleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('My Company');
  const [timezone, setTimezone] = useState('Company Timezone');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [days, setDays] = useState<DayRow[]>([
    { day: 'MONDAY', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  ]);

  const applyScheduleToForm = (s: WorkingScheduleDetail) => {
    setName(s.name);
    setCompany(s.company);
    setTimezone(s.timezone);
    setStatus(s.status as 'ACTIVE' | 'INACTIVE');
    setDays(s.days.map((d) => ({ day: d.day, startTime: d.startTime, endTime: d.endTime, breakMinutes: d.breakMinutes })));
  };

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      setIsLoading(true);
      const res = await api.get<WorkingScheduleDetail>(`/working-schedules/${id}`);
      if (res.success && res.data) {
        setSchedule(res.data);
        applyScheduleToForm(res.data);
      }
      setIsLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalHours = Math.round(
    days.reduce((sum, d) => sum + computeDayHours(d.startTime, d.endTime, d.breakMinutes), 0) * 100
  ) / 100;

  const availableDays = (currentDay: string) =>
    WEEK_DAYS.filter((d) => d === currentDay || !days.some((row) => row.day === d));

  const addDay = () => {
    const unused = WEEK_DAYS.find((d) => !days.some((row) => row.day === d));
    if (!unused) return;
    setDays((prev) => [...prev, { day: unused, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }]);
  };

  const removeDay = (index: number) => {
    setDays((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDay = (index: number, field: keyof DayRow, value: string | number) => {
    setDays((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        calendarType: schedule?.calendarType || 'Standard',
        company,
        timezone,
        status,
        days: days.map((d) => ({
          day: d.day,
          startTime: d.startTime,
          endTime: d.endTime,
          breakMinutes: Number(d.breakMinutes) || 0,
        })),
      };

      const res = isNew
        ? await api.post<WorkingScheduleDetail>('/working-schedules', payload)
        : await api.put<WorkingScheduleDetail>(`/working-schedules/${id}`, payload);

      if (res.success && res.data) {
        if (isNew) {
          router.push(`/dashboard/working-schedules/${res.data.id}`);
        } else {
          setSchedule(res.data);
          applyScheduleToForm(res.data);
          setIsEditing(false);
        }
      } else {
        setError(res.error || 'Failed to save working schedule');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save working schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (schedule) applyScheduleToForm(schedule);
    setError(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading schedule…</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/working-schedules')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>

        {!isNew &&
          (isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving} className="rounded-xl">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        )}

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-slate-900 truncate min-w-0">{isNew ? 'New Working Schedule' : name}</h1>
          {!isNew && <StatusBadge status={status} className="shrink-0" />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Schedule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Company</Label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Days per Week</Label>
            <Input
              disabled
              value={days.length}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Hours per Week</Label>
            <Input
              disabled
              value={`${totalHours}h`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Timezone</Label>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            {isEditing ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            ) : (
              <Input disabled value={status} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Weekly Schedule</div>
            {isEditing && days.length < WEEK_DAYS.length && (
              <Button size="sm" variant="outline" onClick={addDay} className="rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Day
              </Button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3">End Time</th>
                    <th className="p-3">Break (min)</th>
                    <th className="p-3">Hours</th>
                    {isEditing && <th className="p-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {days.map((d, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        {isEditing ? (
                          <select
                            value={d.day}
                            onChange={(e) => updateDay(idx, 'day', e.target.value)}
                            className="h-8 rounded-lg border border-slate-200 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {availableDays(d.day).map((day) => (
                              <option key={day} value={day}>
                                {day.charAt(0) + day.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-medium text-slate-700">{d.day.charAt(0) + d.day.slice(1).toLowerCase()}</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="time"
                          value={d.startTime}
                          onChange={(e) => updateDay(idx, 'startTime', e.target.value)}
                          disabled={!isEditing}
                          className="h-8 rounded-lg border border-slate-200 bg-background px-2 text-xs disabled:bg-transparent disabled:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="time"
                          value={d.endTime}
                          onChange={(e) => updateDay(idx, 'endTime', e.target.value)}
                          disabled={!isEditing}
                          className="h-8 rounded-lg border border-slate-200 bg-background px-2 text-xs disabled:bg-transparent disabled:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min={0}
                          value={d.breakMinutes}
                          onChange={(e) => updateDay(idx, 'breakMinutes', Number(e.target.value))}
                          disabled={!isEditing}
                          className="h-8 w-20 rounded-lg border border-slate-200 bg-background px-2 text-xs disabled:bg-transparent disabled:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="p-2.5 font-semibold text-blue-600">
                        {computeDayHours(d.startTime, d.endTime, d.breakMinutes)}h
                      </td>
                      {isEditing && (
                        <td className="p-2.5">
                          {days.length > 1 && (
                            <button onClick={() => removeDay(idx)} className="text-slate-400 hover:text-rose-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end text-sm">
            <span className="text-slate-500 mr-2">Total Weekly Hours:</span>
            <span className="font-bold text-slate-900">{totalHours}h</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Use this schedule as the employee/contract working pattern. Attendance and payroll may use it as the
          expected working time.
        </p>

        {isNew && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Creating…' : 'Create Schedule'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
