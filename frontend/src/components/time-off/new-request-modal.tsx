'use client';

import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeSelect } from '@/components/shared/employee-select';
import { api } from '@/lib/api';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface TimeOffTypeOption {
  id: string;
  name: string;
}

interface NewRequestModalProps {
  employees: EmployeeOption[];
  types: TimeOffTypeOption[];
  onClose: () => void;
  onCreated: () => void;
}

function daysBetweenInclusive(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(`${start}T00:00:00.000Z`).getTime();
  const e = new Date(`${end}T00:00:00.000Z`).getTime();
  if (e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export function NewRequestModal({ employees, types, onClose, onCreated }: NewRequestModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalDays = useMemo(() => daysBetweenInclusive(startDate, endDate), [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !timeOffTypeId || !startDate || !endDate || totalDays <= 0) {
      setError('Select an employee, a time off type, and a valid date range.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post('/time-off/requests', {
        employeeId,
        timeOffTypeId,
        startDate,
        endDate,
        totalDays,
        reason: reason || undefined,
      });
      if (res.success) {
        onCreated();
      } else {
        setError(res.error || 'Failed to submit request');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Time Off Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Employee</Label>
            <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />
          </div>

          <div className="space-y-1.5">
            <Label>Time Off Type</Label>
            <select
              value={timeOffTypeId}
              onChange={(e) => setTimeOffTypeId(e.target.value)}
              required
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Duration: <span className="font-semibold text-slate-900">{totalDays > 0 ? `${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}` : '—'}</span>
          </div>

          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family vacation" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalDays <= 0}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
