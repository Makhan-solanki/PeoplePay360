'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewRuleModal } from '@/components/payroll/new-rule-modal';
import { Search, PlusCircle, X } from 'lucide-react';

interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
}

interface SalaryStructure {
  id: string;
  name: string;
  rules: SalaryRule[];
}

interface RuleRow extends SalaryRule {
  structureId: string;
  structureName: string;
}

const CATEGORY_TONE: Record<string, string> = {
  BASIC: 'bg-slate-100 text-slate-700',
  ALLOWANCE: 'bg-emerald-100 text-emerald-800',
  DEDUCTION: 'bg-rose-100 text-rose-800',
  GROSS: 'bg-blue-100 text-blue-800',
  NET: 'bg-blue-100 text-blue-800',
};

export default function SalaryRulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const structureFilterId = searchParams.get('structureId');

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRules = async () => {
    setIsLoading(true);
    const res = await api.get<SalaryStructure[]>('/payroll/structures');
    if (res.success && res.data) {
      setStructures(res.data);
      const flattened = res.data.flatMap((s) =>
        s.rules.map((r) => ({ ...r, structureId: s.id, structureName: s.name }))
      );
      setRules(flattened.sort((a, b) => a.sequence - b.sequence));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const structureFilter = structureFilterId ? rules.find((r) => r.structureId === structureFilterId) : null;

  const filtered = useMemo(() => {
    let rows = rules;
    if (structureFilterId) rows = rows.filter((r) => r.structureId === structureFilterId);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => [r.name, r.code, r.structureName].some((f) => f.toLowerCase().includes(q)));
    return rows;
  }, [rules, structureFilterId, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Salary Rules</h1>
            <p className="text-xs text-slate-500">List view.</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={structures.length === 0}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search salary rules..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          {structureFilter && (
            <button
              onClick={() => router.push('/dashboard/payroll/rules')}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold whitespace-nowrap"
            >
              {structureFilter.structureName}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading rules…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No salary rules found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Rule Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Structure</th>
                  <th className="p-3 text-right">Sequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/dashboard/payroll/rules/${r.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-medium text-slate-800">{r.name}</td>
                    <td className="p-3 text-slate-500 font-mono">{r.code}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${CATEGORY_TONE[r.category] ?? 'bg-blue-100 text-blue-800'}`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{r.structureName}</td>
                    <td className="p-3 text-right text-slate-500">{r.sequence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        List view should expose name, code, category, structure and sequence — the fields needed to understand a
        payroll rule quickly.
      </p>

      {showCreateModal && (
        <NewRuleModal
          structures={structures}
          defaultStructureId={structureFilterId ?? undefined}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newId) => {
            setShowCreateModal(false);
            router.push(`/dashboard/payroll/rules/${newId}`);
          }}
        />
      )}
    </div>
  );
}
