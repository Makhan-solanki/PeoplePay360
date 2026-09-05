'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface AllocationRow {
  id: string;
  allocatedDays: number;
  usedDays: number;
  year: number;
  timeOffType: { id: string; name: string };
}

interface AllocationDetail extends AllocationRow {
  employee: EmployeeOption;
}

export default function AllocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [allocation, setAllocation] = useState<AllocationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const empRes = await api.get<EmployeeOption[]>('/employees');
      const employees = empRes.success && empRes.data ? empRes.data : [];

      const results = await Promise.all(
        employees.map((e) => api.get<AllocationRow[]>(`/time-off/allocations?employeeId=${e.id}`))
      );

      let found: AllocationDetail | null = null;
      results.forEach((res, idx) => {
        if (res.success && res.data) {
          const match = res.data.find((a) => a.id === id);
          if (match) found = { ...match, employee: employees[idx] };
        }
      });
      setAllocation(found);
      setIsLoading(false);
    };
    load();
  }, [id]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading allocation…</div>;
  }

  if (!allocation) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Allocation not found.</div>;
  }

  const remaining = allocation.allocatedDays - allocation.usedDays;
  const notWiredNotice = () =>
    setNotice('Allocation approval workflow isn’t wired to the backend yet — coming in the next integration pass.');

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <button
        onClick={() => router.push('/dashboard/time-off/allocations')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Allocation / <span className="text-slate-900">{allocation.employee.firstName} {allocation.employee.lastName}</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {notice && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={notWiredNotice} size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button onClick={notWiredNotice} variant="outline" size="sm" className="rounded-xl">
            <X className="w-3.5 h-3.5 mr-1" /> Refuse
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Employee</Label>
            <Input
              disabled
              value={`${allocation.employee.firstName} ${allocation.employee.lastName}`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Taken</Label>
            <Input disabled value={`${allocation.usedDays} Days`} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Time Off Type</Label>
            <Input disabled value={allocation.timeOffType.name} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Remaining</Label>
            <Input disabled value={`${remaining} Days`} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Allocated</Label>
            <Input disabled value={`${allocation.allocatedDays} Days`} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Approver</Label>
            <Input disabled value="HR Manager" className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            <div className="flex h-10 items-center">
              <StatusBadge status="APPROVED" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Validity</Label>
            <Input disabled value={`${allocation.year} Annual Balance`} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-700">Description</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Annual leave balance granted at start of policy year.
          </p>
        </div>

        <p className="text-xs text-slate-400">Approved allocation is what creates available leave balance for the employee.</p>
      </div>
    </div>
  );
}
