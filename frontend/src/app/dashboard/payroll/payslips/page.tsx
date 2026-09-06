'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { shortWarningLabel } from '@/lib/payroll-warnings';
import { Search, PlusCircle, AlertCircle } from 'lucide-react';

interface PayrunSummary {
  id: string;
  name: string;
  periodStartDate: string;
  periodEndDate: string;
  salaryStructure: { name: string };
}

interface PayslipRow {
  id: string;
  basicWage: number;
  grossPay: number;
  netPay: number;
  status: string;
  warnings: string[] | null;
  employee: { firstName: string; lastName: string; department: string };
}

interface PayrunDetail extends PayrunSummary {
  payslips: PayslipRow[];
}

interface PayslipWithPayrun extends PayslipRow {
  payrunName: string;
  periodStartDate: string;
  periodEndDate: string;
  structureName: string;
}

function periodLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function PayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<PayslipWithPayrun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const listRes = await api.get<PayrunSummary[]>('/payroll/payruns');
      const payrunIds = listRes.success && listRes.data ? listRes.data.map((p) => p.id) : [];

      const details = await Promise.all(payrunIds.map((id) => api.get<PayrunDetail>(`/payroll/payruns/${id}`)));

      const combined: PayslipWithPayrun[] = [];
      details.forEach((res) => {
        if (res.success && res.data) {
          res.data.payslips.forEach((slip) =>
            combined.push({
              ...slip,
              payrunName: res.data!.name,
              periodStartDate: res.data!.periodStartDate,
              periodEndDate: res.data!.periodEndDate,
              structureName: res.data!.salaryStructure.name,
            })
          );
        }
      });
      setPayslips(combined);
      setIsLoading(false);
    };
    load();
  }, []);

  const periods = useMemo(
    () => Array.from(new Set(payslips.map((s) => periodLabel(s.periodStartDate)))),
    [payslips]
  );

  const filtered = useMemo(() => {
    let rows = payslips;
    if (period !== 'all') rows = rows.filter((s) => periodLabel(s.periodStartDate) === period);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((s) =>
        [s.employee.firstName, s.employee.lastName, s.employee.department, s.payrunName].some((f) =>
          f.toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [payslips, period, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      {notice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-amber-700 hover:text-amber-900 font-bold">×</button>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Payslips</h1>
          <p className="text-xs text-slate-500">List view of employee payslips.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            onClick={() => setNotice('Payslips are generated from a Payrun — create one from Payroll ▶ Payruns.')}
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
              placeholder="Search payslips..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-background px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All periods</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                Period: {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading payslips…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No payslips found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Warning</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Basic</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Net</th>
                  <th className="p-3">Structure</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slip) => {
                  const warning = shortWarningLabel(slip.warnings);
                  return (
                    <tr
                      key={slip.id}
                      onClick={() => router.push(`/dashboard/payroll/payslips/${slip.id}`)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900">
                        {slip.employee.firstName} {slip.employee.lastName}
                        <div className="text-[10px] text-slate-400 font-normal">{slip.employee.department}</div>
                      </td>
                      <td className="p-3">
                        {warning ? (
                          <span className="text-amber-600 font-semibold">{warning}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(slip.periodStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} —{' '}
                        {new Date(slip.periodEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-3 text-slate-600">${slip.basicWage.toLocaleString()}</td>
                      <td className="p-3 text-slate-600">${slip.grossPay.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-blue-600">${slip.netPay.toLocaleString()}</td>
                      <td className="p-3 text-slate-600">{slip.structureName}</td>
                      <td className="p-3 text-right">
                        <StatusBadge status={slip.status} label={slip.status === 'PAID' || slip.status === 'CONFIRMED' ? 'Done' : slip.status === 'DRAFT' ? 'Draft' : slip.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
