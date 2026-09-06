'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { NewStructureModal } from '@/components/payroll/new-structure-modal';
import { Search, PlusCircle } from 'lucide-react';

interface SalaryStructureRow {
  id: string;
  name: string;
  rules: { id: string }[];
}

interface ContractRow {
  employeeId: string;
  salaryStructureId: string;
  status: string;
}

export default function SalaryStructuresPage() {
  const router = useRouter();
  const [structures, setStructures] = useState<SalaryStructureRow[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadStructures = async () => {
    setIsLoading(true);
    const [structRes, contractRes] = await Promise.all([
      api.get<SalaryStructureRow[]>('/payroll/structures'),
      api.get<ContractRow[]>('/contracts'),
    ]);
    if (structRes.success && structRes.data) setStructures(structRes.data);
    if (contractRes.success && contractRes.data) {
      const counts: Record<string, number> = {};
      const seen = new Set<string>();
      contractRes.data
        .filter((c) => c.status === 'ACTIVE')
        .forEach((c) => {
          const key = `${c.salaryStructureId}:${c.employeeId}`;
          if (!seen.has(key)) {
            seen.add(key);
            counts[c.salaryStructureId] = (counts[c.salaryStructureId] ?? 0) + 1;
          }
        });
      setEmployeeCounts(counts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter((s) => s.name.toLowerCase().includes(q));
  }, [structures, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Salary Structures</h1>
          <p className="text-xs text-slate-500">List view.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search structures..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading structures…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No salary structures found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Structure Name</th>
                  <th className="p-3">Rules</th>
                  <th className="p-3">Employees</th>
                  <th className="p-3 text-right">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/dashboard/payroll/structures/${s.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3 text-slate-600">{s.rules.length} rules</td>
                    <td className="p-3 text-slate-600">{employeeCounts[s.id] ?? 0} employees</td>
                    <td className="p-3 text-right">
                      <StatusBadge status="ACTIVE" label="Active" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        Structures group salary rules; rules define the ordered salary computation used by a payslip.
      </p>

      {showCreateModal && (
        <NewStructureModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.push(`/dashboard/payroll/structures/${id}`);
          }}
        />
      )}
    </div>
  );
}
