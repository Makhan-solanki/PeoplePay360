'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { NewPayrunWizard } from '@/components/payroll/new-payrun-wizard';
import { Search, PlusCircle, Pencil, AlertTriangle } from 'lucide-react';

interface PayrunRow {
  id: string;
  name: string;
  periodStartDate: string;
  periodEndDate: string;
  status: string;
  warnings: string[] | null;
  payslips: { id: string; netPay: number; status: string }[];
}

interface SalaryStructureOption {
  id: string;
  name: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PayrunsPage() {
  const router = useRouter();
  const [payruns, setPayruns] = useState<PayrunRow[]>([]);
  const [structures, setStructures] = useState<SalaryStructureOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);

  const loadPayruns = async () => {
    setIsLoading(true);
    const res = await api.get<PayrunRow[]>('/payroll/payruns');
    if (res.success && res.data) {
      setPayruns(res.data);
      const years = Array.from(new Set(res.data.map((p) => new Date(p.periodStartDate).getFullYear()))).sort(
        (a, b) => b - a
      );
      if (years.length > 0) setYear(String(years[0]));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPayruns();
    api.get<SalaryStructureOption[]>('/payroll/structures').then((res) => {
      if (res.success && res.data) setStructures(res.data);
    });
  }, []);

  const years = useMemo(
    () => Array.from(new Set(payruns.map((p) => new Date(p.periodStartDate).getFullYear()))).sort((a, b) => b - a),
    [payruns]
  );

  const filtered = useMemo(() => {
    let rows = payruns;
    if (year !== 'all') rows = rows.filter((p) => new Date(p.periodStartDate).getFullYear() === Number(year));
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q));
    return rows;
  }, [payruns, year, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Payruns</h1>
          <p className="text-xs text-slate-500">Payrun view for payroll periods.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            onClick={() => setShowWizard(true)}
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
              placeholder="Search payruns..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-background px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading payruns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No payruns found for this period.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const warningCount = p.warnings?.length ?? 0;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/dashboard/payroll/payruns/${p.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(p.periodStartDate)} — {formatDate(p.periodEndDate)}
                  </div>
                </div>
                <div className="text-sm text-slate-500 hidden sm:block">{p.payslips.length} employees</div>
                <div className="text-right space-y-1">
                  <StatusBadge status={p.status} />
                  <div className="flex items-center justify-end gap-1 text-[11px] text-amber-600">
                    {warningCount > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        {warningCount} warning{warningCount > 1 ? 's' : ''}
                      </>
                    ) : (
                      <span className="text-slate-300">No warnings</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/payroll/payruns/${p.id}`);
                  }}
                  className="w-8 h-8 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 flex items-center justify-center shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        Each Payrun represents one payroll period and groups the payslips generated for that period.
      </p>

      {showWizard && (
        <NewPayrunWizard
          salaryStructures={structures}
          onClose={() => setShowWizard(false)}
          onCreated={(payrunId) => {
            setShowWizard(false);
            router.push(`/dashboard/payroll/payruns/${payrunId}`);
          }}
        />
      )}
    </div>
  );
}
