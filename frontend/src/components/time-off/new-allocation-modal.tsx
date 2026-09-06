'use client';

import React, { useState } from 'react';
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

interface TypeOption {
  id: string;
  name: string;
}

interface NewAllocationModalProps {
  employees: EmployeeOption[];
  types: TypeOption[];
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewAllocationModal({ employees, types, onClose, onCreated }: NewAllocationModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [timeOffTypeId, setTimeOffTypeId] = useState(types[0]?.id ?? '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [allocatedDays, setAllocatedDays] = useState('20');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !timeOffTypeId) {
      setError('Select an employee and a time off type.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<{ id: string }>('/time-off/allocations', {
        employeeId,
        timeOffTypeId,
        year,
        allocatedDays: Number(allocatedDays),
      });
      if (res.success && res.data) {
        onCreated(res.data.id);
      } else {
        setError(res.error || 'Failed to create allocation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Allocation</h2>
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
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Allocated Days</Label>
              <Input type="number" value={allocatedDays} onChange={(e) => setAllocatedDays(e.target.value)} required min={0} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            If an allocation already exists for this employee/type/year, it will be replaced with this value.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Creating…' : 'Create Allocation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
