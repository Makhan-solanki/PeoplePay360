'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, CheckCircle2, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

interface LineItem {
  ruleCode: string;
  name: string;
  category: string;
  amount: number;
}

interface Payslip {
  id: string;
  netPay: number;
  basicWage: number;
  lineItems: LineItem[];
  employee: { firstName: string; lastName: string; department: string; employeeCode: string; jobPosition: string; bankName: string | null; bankAccountNo: string | null };
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
  payslips: Payslip[];
}

export default function PayrunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [payrun, setPayrun] = useState<PayrunDetail | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<PayrunDetail>(`/payroll/payruns/${id}`);
    if (res.success && res.data) {
      setPayrun(res.data);
      setSelectedPayslip((prev) => res.data!.payslips.find((s) => s.id === prev?.id) ?? res.data!.payslips[0] ?? null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (action: () => Promise<any>, successMessage: string) => {
    setIsBusy(true);
    setActionError(null);
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
        Payruns / <span className="text-slate-900">{payrun.name}</span>
      </button>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-xs text-emerald-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 text-xs text-rose-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-400 font-medium">Payrun Name</div>
              <div className="text-base font-bold text-slate-900">{payrun.name}</div>
            </div>
            <StatusBadge status={payrun.status} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Gross</div>
              <div className="text-sm font-bold text-slate-900">${payrun.totalGross.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Deductions</div>
              <div className="text-sm font-bold text-rose-600">-${payrun.totalDeductions.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Net</div>
              <div className="text-sm font-bold text-blue-600">${payrun.totalNet.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {(payrun.status === 'COMPUTED' || payrun.status === 'VALIDATED') && (
              <Button
                onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/compute`), 'Payslips recomputed from current contracts and rules.')}
                disabled={isBusy}
                variant="outline"
                className="w-full rounded-xl text-xs h-10 font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Recompute
              </Button>
            )}
            {payrun.status === 'COMPUTED' && (
              <Button
                onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/validate`), 'Payrun validated and locked for disbursement!')}
                disabled={isBusy}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs h-10 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Validate & Lock Payrun
              </Button>
            )}
            {payrun.status === 'VALIDATED' && (
              <Button
                onClick={() => runAction(() => api.post(`/payroll/payruns/${payrun.id}/pay`), 'Payrun marked as PAID!')}
                disabled={isBusy}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 font-semibold shadow-md shadow-emerald-500/20"
              >
                <DollarSign className="w-4 h-4 mr-1.5" /> Mark Batch as PAID
              </Button>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Generated Payslips ({payrun.payslips.length})
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {payrun.payslips.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No payslips generated yet.</div>
              ) : (
                payrun.payslips.map((slip) => (
                  <div
                    key={slip.id}
                    onClick={() => setSelectedPayslip(slip)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedPayslip?.id === slip.id
                        ? 'bg-blue-50/60 border-blue-400 text-blue-950 font-semibold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{slip.employee.firstName} {slip.employee.lastName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{slip.employee.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">${slip.netPay.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Net Pay</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {selectedPayslip ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Payslip: {selectedPayslip.employee.firstName} {selectedPayslip.employee.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Employee ID: {selectedPayslip.employee.employeeCode} • Position: {selectedPayslip.employee.jobPosition}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                  Contract Base: ${selectedPayslip.basicWage.toLocaleString()}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-3">Sequence</th>
                        <th className="p-3">Rule Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Computed Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPayslip.lineItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={
                            item.category === 'GROSS'
                              ? 'bg-slate-50/80 font-bold text-slate-900'
                              : item.category === 'NET'
                              ? 'bg-blue-50/50 font-bold text-blue-900'
                              : item.category === 'DEDUCTION'
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }
                        >
                          <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-medium">{item.name} ({item.ruleCode})</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.category === 'BASIC'
                                  ? 'bg-slate-100 text-slate-700'
                                  : item.category === 'ALLOWANCE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.category === 'DEDUCTION'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">${item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-500/10">
                <div>
                  <div className="text-xs font-medium text-blue-100">Final Net Disbursement</div>
                  <div className="text-2xl font-black">${selectedPayslip.netPay.toLocaleString()}</div>
                </div>
                <div className="text-right text-xs text-blue-100">
                  <div>Bank: {selectedPayslip.employee.bankName || 'Missing'}</div>
                  <div>A/C: {selectedPayslip.employee.bankAccountNo || 'Missing'}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No payslips yet. Generate payslips to view the rule-driven computation breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
