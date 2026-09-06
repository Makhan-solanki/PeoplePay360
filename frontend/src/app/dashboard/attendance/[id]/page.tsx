'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Check, X, Pencil, AlertCircle } from 'lucide-react';

interface AttendanceDetail {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  status: string;
  notes: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    manager: { firstName: string; lastName: string } | null;
  };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [status, setStatus] = useState('PRESENT');
  const [notes, setNotes] = useState('');
  const [checkInLocal, setCheckInLocal] = useState('');
  const [checkOutLocal, setCheckOutLocal] = useState('');

  const applyToForm = (record: AttendanceDetail) => {
    setStatus(record.status);
    setNotes(record.notes ?? '');
    setCheckInLocal(toDateTimeLocal(record.checkIn));
    setCheckOutLocal(record.checkOut ? toDateTimeLocal(record.checkOut) : '');
  };

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<AttendanceDetail>(`/attendances/${id}`);
    if (res.success && res.data) {
      setAttendance(res.data);
      applyToForm(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const overtimeHours = attendance ? Math.max(0, Math.round((attendance.workedHours - 8) * 100) / 100) : 0;

  const cancelEdit = () => {
    if (attendance) applyToForm(attendance);
    setSaveError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!attendance) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.put(`/attendances/${attendance.id}`, {
        status,
        notes: notes || null,
        checkIn: checkInLocal ? new Date(checkInLocal).toISOString() : undefined,
        checkOut: checkOutLocal ? new Date(checkOutLocal).toISOString() : null,
      });
      if (res.success) {
        setIsEditing(false);
        load();
      } else {
        setSaveError(res.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading attendance record…</div>;
  }

  if (!attendance) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Attendance record not found.</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/attendance')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Attendance / {attendance.employee.firstName} {attendance.employee.lastName} /{' '}
          <span className="text-slate-900">{new Date(attendance.date).toLocaleDateString()}</span>
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving} className="rounded-xl">
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isSaving} className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
              <Check className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {saveError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Employee</Label>
            <Input
              disabled
              value={`${attendance.employee.firstName} ${attendance.employee.lastName}`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Department</Label>
            <Input
              disabled
              value={attendance.employee.department}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Check In</Label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={checkInLocal}
                onChange={(e) => setCheckInLocal(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            ) : (
              <Input
                disabled
                value={formatDateTime(attendance.checkIn)}
                className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Manager</Label>
            <Input
              disabled
              value={attendance.employee.manager ? `${attendance.employee.manager.firstName} ${attendance.employee.manager.lastName}` : '—'}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Check Out</Label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={checkOutLocal}
                onChange={(e) => setCheckOutLocal(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            ) : (
              <Input
                disabled
                value={attendance.checkOut ? formatDateTime(attendance.checkOut) : 'In Progress'}
                className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            {isEditing ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="HALF_DAY">HALF_DAY</option>
              </select>
            ) : (
              <div className="flex h-10 items-center">
                <StatusBadge status={attendance.status} />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Worked Hours</Label>
            <Input
              disabled
              value={attendance.workedHours.toFixed(2)}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Overtime</Label>
            <Input
              disabled
              value={`${overtimeHours.toFixed(2)} hrs`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-700">Notes</div>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="System-generated from check in/out or manually corrected by an authorized user."
            />
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              {attendance.notes || 'System-generated from check in/out or manually corrected by an authorized user.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
