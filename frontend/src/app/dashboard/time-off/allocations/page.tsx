'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { NewAllocationModal } from '@/components/time-off/new-allocation-modal';
import { Search, PlusCircle } from 'lucide-react';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface TypeOption {
  id: string;
  name: string;
}

interface AllocationRow {
  id: string;
  employeeId: string;
  allocatedDays: number;
  usedDays: number;
  year: number;
  status: string;
  timeOffType: { id: string; name: string };
}

interface AllocationWithEmployee extends AllocationRow {
  employee: EmployeeOption;
}

export default function AllocationsPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<AllocationWithEmployee[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAllocations = async () => {
    setIsLoading(true);
    const [empRes, typeRes] = await Promise.all([
      api.get<EmployeeOption[]>('/employees'),
      api.get<TypeOption[]>('/time-off/types'),
    ]);
    const emps = empRes.success && empRes.data ? empRes.data : [];
    setEmployees(emps);
    if (typeRes.success && typeRes.data) setTypes(typeRes.data);

    const results = await Promise.all(
      emps.map((e) => api.get<AllocationRow[]>(`/time-off/allocations?employeeId=${e.id}`))
    );

    const combined: AllocationWithEmployee[] = [];
    results.forEach((res, idx) => {
      if (res.success && res.data) {
        res.data.forEach((a) => combined.push({ ...a, employee: emps[idx] }));
      }
    });
    setAllocations(combined);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allocations;
    return allocations.filter((a) =>
      [a.employee.firstName, a.employee.lastName, a.timeOffType.name].some((f) => f.toLowerCase().includes(q))
    );
  }, [allocations, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Allocations</h1>
          <p className="text-xs text-slate-500">List view opened from Time Off ▼ → Allocations.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={types.length === 0}
            size="sm"
            className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search allocations..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading allocations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No allocations found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Allocated</th>
                  <th className="p-3">Taken</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/dashboard/time-off/allocations/${a.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">
                      {a.employee.firstName} {a.employee.lastName}
                    </td>
                    <td className="p-3 text-slate-600">{a.timeOffType.name}</td>
                    <td className="p-3 text-slate-600">{a.allocatedDays} days</td>
                    <td className="p-3 text-slate-600">{a.usedDays} days</td>
                    <td className="p-3 font-semibold text-brand-600">{a.allocatedDays - a.usedDays} days</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <NewAllocationModal
          employees={employees}
          types={types}
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.push(`/dashboard/time-off/allocations/${id}`);
          }}
        />
      )}
    </div>
  );
}
