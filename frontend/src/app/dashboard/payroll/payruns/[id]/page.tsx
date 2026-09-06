'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { shortWarningLabel } from '@/lib/payroll-warnings';
import { ArrowLeft, CheckCircle2, DollarSign, AlertCircle, RefreshCw, Send, FileText } from 'lucide-react';

interface Payslip {
  id: string;
  status: string;
  workedDays: number;
  basicWage: number;
  grossPay: number;
  netPay: number;
  warnings: string[] | null;
  employee: { firstName: string; lastName: string };
}

interface PayrunDetail {
  id: string;
  name: string;
  periodStartDate: string;
  periodEndDate: string;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  salaryStructure: { name: string };
  payslips: Payslip[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PayrunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [payrun, setPayrun] = useState<PayrunDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<PayrunDetail>(`/payroll/payruns/${id}`);
    if (res.success && res.data) setPayrun(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (action: () => Promise<any>, successMessage: string) => {
    setIsBusy(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await action();
      if (res.success) {
        setActionSuccess(successMessage);
        load();
      } else {
        setActionError(res.error || 'Action failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading payrun…</div>;
  }

  if (!payrun) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Payrun not found.</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <button
        onClick={() => router.push('/dashboard/payroll/payruns')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Payrun / <span className="text-slate-900">{payrun.name}</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800 flex justify-between items-center">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
          </div>
        )}
        {actionError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-800 flex justify-between items-center">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
          </div>
        )}
        {notice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 flex justify-between items-center">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-amber-700 hover:text-amber-900 font-bold">×</button>
          </div>
        )}

        <div>
          <h1 className="text-lg font-bold text-slate-900">Payrun / {payrun.name}</h1>
          <p className="text-xs text-slate-500">Open one Payrun to compute and manage its payslips.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/compute`), 'Payslips computed from current contracts and rules.')}
              disabled={isBusy || payrun.status === 'PAID'}
              size="sm"
              className={
                payrun.status === 'DRAFT' || payrun.status === 'COMPUTED'
                  ? 'rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold'
                  : 'rounded-xl text-xs font-semibold'
              }
              variant={payrun.status === 'DRAFT' || payrun.status === 'COMPUTED' ? undefined : 'outline'}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Compute
            </Button>
            <Button
              onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/validate`), 'Payrun validated and locked for disbursement.')}
              disabled={isBusy || payrun.status !== 'COMPUTED'}
              size="sm"
              variant="outline"
              className="rounded-xl text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Validate
            </Button>
            <Button
              onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/pay`), 'Payrun marked as PAID.')}
              disabled={isBusy || payrun.status !== 'VALIDATED'}
              size="sm"
              variant="outline"
              className="rounded-xl text-xs font-semibold"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Mark Paid
            </Button>
          </div>

          <Button
            onClick={() => setNotice('Sending payslips to employees isn’t wired up yet — this app has no email delivery configured. Payslips can be shared via the PDF link on each row for now.')}
            size="sm"
            className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shrink-0"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send Payslips
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Name</Label>
            <Input disabled value={payrun.name} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Salary Structure</Label>
            <Input disabled value={payrun.salaryStructure.name} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Period</Label>
            <Input
              disabled
              value={`${formatDate(payrun.periodStartDate)} — ${formatDate(payrun.periodEndDate)}`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            <div className="flex h-10 items-center">
              <StatusBadge status={payrun.status} />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            Payslips in this Payrun ({payrun.payslips.length})
          </div>

          {payrun.payslips.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
              No payslips generated yet — run Compute to generate them from current contracts.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Warning</th>
                      <th className="p-3">Worked</th>
                      <th className="p-3">Basic</th>
                      <th className="p-3">Gross</th>
                      <th className="p-3">Net</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrun.payslips.map((slip) => {
                      const warning = shortWarningLabel(slip.warnings);
                      return (
                        <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">
                            {slip.employee.firstName} {slip.employee.lastName}
                          </td>
                          <td className="p-3">
                            {warning ? (
                              <span className="text-amber-600 font-semibold">{warning}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">{slip.workedDays}</td>
                          <td className="p-3 text-slate-600">${slip.basicWage.toLocaleString()}</td>
                          <td className="p-3 text-slate-600">${slip.grossPay.toLocaleString()}</td>
                          <td className="p-3 font-semibold text-slate-900">${slip.netPay.toLocaleString()}</td>
                          <td className="p-3">
                            <StatusBadge status={slip.status} />
                          </td>
                          <td className="p-3 text-right">
                            <Link
                              href={`/dashboard/payroll/payslips/${slip.id}`}
                              className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" /> PDF
                            </Link>
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

        <p className="text-xs text-slate-400">
          Useful note: warnings such as missing account data or duplicate payslips should be visible before payroll is finalized.
        </p>
      </div>
    </div>
  );
}
