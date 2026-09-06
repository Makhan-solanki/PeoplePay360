'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, RefreshCw, DollarSign, Printer, AlertCircle } from 'lucide-react';

interface LineItem {
  ruleCode: string;
  name: string;
  category: string;
  amount: number;
}

interface PayslipDetail {
  id: string;
  status: string;
  basicWage: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  workedDays: number;
  lineItems: LineItem[];
  warnings: string[] | null;
  payrunId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    jobPosition: string;
    department: string;
    bankName: string | null;
    bankAccountNo: string | null;
  };
  payrun: { name: string; periodStartDate: string; periodEndDate: string; salaryStructure: { name: string } };
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  COMPUTED: 'Computed',
  CONFIRMED: 'Done',
  PAID: 'Done',
};

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<PayslipDetail>(`/payroll/payslips/${id}`);
    if (res.success && res.data) setPayslip(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCompute = async () => {
    if (!payslip) return;
    setIsBusy(true);
    setActionError(null);
    const res = await api.post(`/payroll/payslips/${payslip.id}/compute`);
    if (res.success) load();
    else setActionError(res.error || 'Failed to compute');
    setIsBusy(false);
  };

  const handleMarkPaid = async () => {
    if (!payslip) return;
    setIsBusy(true);
    setActionError(null);
    const res = await api.post(`/payroll/payslips/${payslip.id}/pay`);
    if (res.success) load();
    else setActionError(res.error || 'Failed to mark as paid');
    setIsBusy(false);
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading payslip…</div>;
  }

  if (!payslip) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Payslip not found.</div>;
  }

  const periodLabel = `${new Date(payslip.payrun.periodStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — ${new Date(payslip.payrun.periodEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <button
        onClick={() => router.push('/dashboard/payroll/payslips')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 print:hidden"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Payslip / {payslip.employee.firstName} {payslip.employee.lastName} /{' '}
        <span className="text-slate-900">
          {new Date(payslip.payrun.periodStartDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6 print:border-0 print:shadow-none">
        {actionError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-center gap-2 print:hidden">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {actionError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button onClick={handleCompute} disabled={isBusy} size="sm" className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Compute
          </Button>
          <Button onClick={handleMarkPaid} disabled={isBusy || payslip.status === 'PAID'} variant="outline" size="sm" className="rounded-xl">
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Mark Paid
          </Button>
          <Button onClick={() => window.print()} size="sm" className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
            <Printer className="w-3.5 h-3.5 mr-1" /> Print Payslip
          </Button>
        </div>
        <p className="text-[11px] text-slate-400 -mt-4 print:hidden">
          Mark Paid requires the parent payrun ({payslip.payrun.name}) to be validated first.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Employee</Label>
            <Input disabled value={`${payslip.employee.firstName} ${payslip.employee.lastName}`} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Period</Label>
            <Input disabled value={periodLabel} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Salary Structure</Label>
            <Input disabled value={payslip.payrun.salaryStructure.name} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            <div className="flex h-10 items-center">
              <StatusBadge status={payslip.status} label={STATUS_LABEL[payslip.status] ?? payslip.status} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Pay Run</Label>
            <Input disabled value={payslip.payrun.name} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Worked Days</Label>
            <Input disabled value={payslip.workedDays} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
        </div>

        {payslip.warnings && payslip.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 space-y-1 print:hidden">
            {payslip.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-800">{w}</p>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm font-bold text-brand-600">Salary Computation</div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Rule</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3 text-right">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslip.lineItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className={
                        item.category === 'GROSS'
                          ? 'bg-slate-50/80 font-bold text-slate-900'
                          : item.category === 'NET'
                          ? 'bg-brand-50/50 font-bold text-brand-900'
                          : item.category === 'DEDUCTION'
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }
                    >
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">{item.category.charAt(0) + item.category.slice(1).toLowerCase()}</td>
                      <td className="p-3 font-mono font-semibold">
                        {item.category === 'DEDUCTION' ? '-' : ''}${item.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-400 font-mono">{item.ruleCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-brand-600 to-indigo-700 p-5 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-brand-500/10 print:bg-none print:border print:border-slate-300 print:text-slate-900">
          <div>
            <div className="text-xs font-medium text-brand-100 print:text-slate-500">Final Net Disbursement</div>
            <div className="text-2xl font-black">${payslip.netPay.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs text-brand-100 print:text-slate-500">
            <div>Bank: {payslip.employee.bankName || 'Missing'}</div>
            <div>A/C: {payslip.employee.bankAccountNo || 'Missing'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
