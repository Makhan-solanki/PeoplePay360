'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface EmployeeFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY_FORM = {
  employeeCode: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  jobPosition: '',
  workingSchedule: 'Standard 40h/week',
};

export function EmployeeFormModal({ onClose, onCreated }: EmployeeFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post('/employees', form);
      if (res.success) {
        onCreated();
      } else {
        setError(res.error || 'Failed to create employee');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900">New Employee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" required value={form.firstName} onChange={update('firstName')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" required value={form.lastName} onChange={update('lastName')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employeeCode">Employee Code</Label>
            <Input id="employeeCode" required placeholder="EMP-105" value={form.employeeCode} onChange={update('employeeCode')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={update('email')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" required value={form.department} onChange={update('department')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jobPosition">Job Position</Label>
              <Input id="jobPosition" required value={form.jobPosition} onChange={update('jobPosition')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={update('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workingSchedule">Working Schedule</Label>
              <Input id="workingSchedule" value={form.workingSchedule} onChange={update('workingSchedule')} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isSubmitting ? 'Creating…' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
