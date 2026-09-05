'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { contractStatusLabel } from '@/lib/contract-status';
import { Search, PlusCircle } from 'lucide-react';

interface ContractRow {
  id: string;
  contractName: string;
  startDate: string;
  endDate: string | null;
  wage: number;
  status: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; department: string };
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ContractRow[]>('/contracts');
        if (res.success && res.data) setContracts(res.data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((c) =>
      [c.contractName, c.employee?.firstName, c.employee?.lastName, c.employee?.employeeCode, c.employee?.department]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [contracts, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Contracts</h1>
            <p className="text-xs text-slate-500">List view of employee contracts.</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/contracts/new')}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts..."
            className="pl-9 rounded-xl border-slate-200 h-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading contracts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No contracts found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Contract</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Wage / Month</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/contracts/${c.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{c.contractName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="p-3 text-slate-700">
                      {c.employee.firstName} {c.employee.lastName}
                      <div className="text-[10px] text-slate-400">{c.employee.department}</div>
                    </td>
                    <td className="p-3 text-slate-600">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">{c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}</td>
                    <td className="p-3 font-semibold text-slate-900">${c.wage.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={c.status} label={contractStatusLabel(c.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
