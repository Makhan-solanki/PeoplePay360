'use client';

import React, { useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface SalaryStructureOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  workingSchedule: string;
  contracts?: { startDate: string; wage: number }[];
}

interface NewPayrunWizardProps {
  salaryStructures: SalaryStructureOption[];
  onClose: () => void;
  onCreated: (payrunId: string) => void;
}

function monthName(dateStr: string) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function NewPayrunWizard({ salaryStructures, onClose, onCreated }: NewPayrunWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [salaryStructureId, setSalaryStructureId] = useState(salaryStructures[0]?.id ?? '');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [empSearch, setEmpSearch] = useState('');

  // Step 1 only collects scope locally — no Payrun exists yet. Employees are
  // fetched here (a read, no side effect) purely to populate step 2's picker.
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryStructureId || !periodStart || !periodEnd) return;
    setError(null);
    setIsLoadingEmployees(true);
    try {
      const empRes = await api.get<EmployeeOption[]>('/employees');
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data.filter((e) => e.contracts && e.contracts.length > 0));
      }
      setStep(2);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q));
  }, [employees, empSearch]);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // The Payrun is created here, only after the user has selected employees —
  // create and generate are chained in this single action.
  const handleCreatePayrun = async () => {
    if (selectedIds.size === 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const createRes = await api.post<{ id: string }>('/payroll/payruns', {
        name: monthName(periodStart),
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        salaryStructureId,
      });
      if (!createRes.success || !createRes.data) {
        setError(createRes.error || 'Failed to create payrun');
        return;
      }

      const payrunId = createRes.data.id;
      const genRes = await api.post(`/payroll/payruns/${payrunId}/generate`, {
        employeeIds: Array.from(selectedIds),
      });
      if (genRes.success) {
        onCreated(payrunId);
      } else {
        setError(genRes.error || 'Failed to generate payslips');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create payrun');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
            <h2 className="text-base font-bold text-slate-900">Select Employee Records</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-6 pt-4 shrink-0">
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3">
                {error}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="pl-9 rounded-xl border-slate-200 h-9"
                />
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {selectedIds.size} / {filteredEmployees.length} selected
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[480px]">
                <thead className="text-slate-500 border-b border-slate-200 font-semibold sticky top-0 bg-white">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2">Employee</th>
                    <th className="p-2">Working Hours</th>
                    <th className="p-2">Start Date</th>
                    <th className="p-2 text-right">Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No eligible employees with an active contract found.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const contract = emp.contracts?.[0];
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => toggleEmployee(emp.id)}
                          className="cursor-pointer hover:bg-slate-50"
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(emp.id)}
                              onChange={() => toggleEmployee(emp.id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="p-2 font-medium text-slate-800 whitespace-nowrap">
                            {emp.firstName} {emp.lastName}
                          </td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">{emp.workingSchedule}</td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {contract ? new Date(contract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="p-2 text-right font-medium text-slate-800 whitespace-nowrap">
                            {contract ? `$${contract.wage.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-100 shrink-0">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
              Back
            </Button>
            <Button
              onClick={handleCreatePayrun}
              disabled={isSubmitting || selectedIds.size === 0}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Creating…' : 'Create payrun'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Pay Run</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleContinue} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Pay Structure</Label>
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              required
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {salaryStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Period</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoadingEmployees}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingEmployees ? 'Loading…' : 'Continue'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl text-slate-500">
              Discard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
