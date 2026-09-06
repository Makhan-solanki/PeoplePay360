'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmployeeSelect } from '@/components/shared/employee-select';
import { api } from '@/lib/api';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

interface CheckInModalProps {
  employees: EmployeeOption[];
  onClose: () => void;
  onCheckedIn: () => void;
}

export function CheckInModal({ employees, onClose, onCheckedIn }: CheckInModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post('/attendances/check-in', { employeeId });
      if (res.success) {
        onCheckedIn();
      } else {
        setError(res.error || 'Failed to check in employee');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check in employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Attendance — Check In</h2>
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

          <p className="text-[11px] text-slate-400">
            Records today&apos;s check-in for the selected employee using the current time.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !employeeId}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Checking in…' : 'Check In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
