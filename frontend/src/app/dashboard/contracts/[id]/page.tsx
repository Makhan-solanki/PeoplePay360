'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeSelect } from '@/components/shared/employee-select';
import { api } from '@/lib/api';
import { contractStatusLabel } from '@/lib/contract-status';
import { ArrowLeft, Check, X, Pencil } from 'lucide-react';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  jobPosition: string;
}

interface SalaryStructureOption {
  id: string;
  name: string;
  description: string | null;
  rules?: { id: string; name: string }[];
}

interface WorkingScheduleOption {
  id: string;
  name: string;
}

interface ContractDetail {
  id: string;
  employeeId: string;
  contractName: string;
  startDate: string;
  endDate: string | null;
  wage: number;
  department: string;
  jobPosition: string;
  status: string;
  salaryStructureId: string;
  workingScheduleId: string | null;
  employee?: { firstName: string; lastName: string };
  salaryStructure?: SalaryStructureOption;
  workingSchedule?: WorkingScheduleOption | null;
}

const EMPTY_FORM = {
  employeeId: '',
  contractName: '',
  startDate: '',
  endDate: '',
  wage: '',
  department: '',
  jobPosition: '',
  status: 'ACTIVE',
  salaryStructureId: '',
  workingScheduleId: '',
};

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructureOption[]>([]);
  const [workingSchedules, setWorkingSchedules] = useState<WorkingScheduleOption[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const load = async () => {
      const [empRes, structRes, scheduleRes] = await Promise.all([
        api.get<EmployeeOption[]>('/employees'),
        api.get<SalaryStructureOption[]>('/payroll/structures'),
        api.get<WorkingScheduleOption[]>('/working-schedules'),
      ]);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (structRes.success && structRes.data) setSalaryStructures(structRes.data);
      if (scheduleRes.success && scheduleRes.data) setWorkingSchedules(scheduleRes.data);

      if (!isNew) {
        setIsLoading(true);
        const res = await api.get<ContractDetail>(`/contracts/${id}`);
        if (res.success && res.data) {
          setContract(res.data);
          setForm({
            employeeId: res.data.employeeId,
            contractName: res.data.contractName,
            startDate: res.data.startDate.slice(0, 10),
            endDate: res.data.endDate ? res.data.endDate.slice(0, 10) : '',
            wage: String(res.data.wage),
            department: res.data.department,
            jobPosition: res.data.jobPosition,
            status: res.data.status,
            salaryStructureId: res.data.salaryStructureId,
            workingScheduleId: res.data.workingScheduleId ?? '',
          });
        }
        setIsLoading(false);
      } else if (structRes.success && structRes.data && structRes.data.length > 0) {
        setForm((prev) => ({ ...prev, salaryStructureId: structRes.data![0].id }));
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateForm = (field: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'employeeId') {
        const emp = employees.find((x) => x.id === value);
        if (emp) {
          next.department = emp.department;
          next.jobPosition = emp.jobPosition;
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        employeeId: form.employeeId,
        contractName: form.contractName,
        startDate: form.startDate,
        endDate: form.endDate || null,
        wage: Number(form.wage),
        department: form.department,
        jobPosition: form.jobPosition,
        status: form.status,
        salaryStructureId: form.salaryStructureId,
        workingScheduleId: form.workingScheduleId || null,
      };

      const res = isNew
        ? await api.post<ContractDetail>('/contracts', payload)
        : await api.put<ContractDetail>(`/contracts/${id}`, payload);

      if (res.success && res.data) {
        if (isNew) {
          router.push(`/dashboard/contracts/${res.data.id}`);
        } else {
          setContract(res.data);
          setIsEditing(false);
        }
      } else {
        setError(res.error || 'Failed to save contract');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save contract');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (contract) {
      setForm({
        employeeId: contract.employeeId,
        contractName: contract.contractName,
        startDate: contract.startDate.slice(0, 10),
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
        wage: String(contract.wage),
        department: contract.department,
        jobPosition: contract.jobPosition,
        status: contract.status,
        salaryStructureId: contract.salaryStructureId,
        workingScheduleId: contract.workingScheduleId ?? '',
      });
    }
    setError(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading contract…</div>;
  }

  const selectedStructure = salaryStructures.find((s) => s.id === form.salaryStructureId);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/contracts')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Contract /{' '}
          <span className="text-slate-900">
            {isNew ? 'New' : contract?.contractName ?? id}
          </span>
        </button>

        {!isNew &&
          (isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving} className="rounded-xl">
                <X className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Employee</Label>
            {isEditing && isNew ? (
              <EmployeeSelect
                employees={employees}
                value={form.employeeId}
                onChange={(id) =>
                  updateForm('employeeId')({ target: { value: id } } as React.ChangeEvent<HTMLSelectElement>)
                }
              />
            ) : (
              <Input
                disabled
                value={
                  contract
                    ? `${contract.employee?.firstName ?? ''} ${contract.employee?.lastName ?? ''}`
                    : employees.find((e) => e.id === form.employeeId)
                    ? `${employees.find((e) => e.id === form.employeeId)!.firstName} ${employees.find((e) => e.id === form.employeeId)!.lastName}`
                    : ''
                }
                className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Department</Label>
            <Input
              value={form.department}
              onChange={updateForm('department')}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Contract Name</Label>
            <Input
              value={form.contractName}
              onChange={updateForm('contractName')}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Job Position</Label>
            <Input
              value={form.jobPosition}
              onChange={updateForm('jobPosition')}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Start Date</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={updateForm('startDate')}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">End Date</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={updateForm('endDate')}
              disabled={!isEditing}
              placeholder="Indefinite"
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Wage / Month</Label>
            <Input
              type="number"
              value={form.wage}
              onChange={updateForm('wage')}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Working Schedule</Label>
            {isEditing ? (
              <select
                value={form.workingScheduleId}
                onChange={updateForm('workingScheduleId')}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— None —</option>
                {workingSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                disabled
                value={workingSchedules.find((s) => s.id === form.workingScheduleId)?.name ?? '—'}
                className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            {isEditing ? (
              <select
                value={form.status}
                onChange={updateForm('status')}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Running (Active)</option>
                <option value="CLOSED">Expired (Closed)</option>
              </select>
            ) : (
              <div className="flex h-10 items-center">
                <StatusBadge status={form.status} label={contractStatusLabel(form.status)} />
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Salary Structure</Label>
            <select
              value={form.salaryStructureId}
              onChange={updateForm('salaryStructureId')}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {salaryStructures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-700">Salary Structure / Notes</div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Structure Type: <span className="font-medium text-slate-700">{selectedStructure?.name ?? '—'}</span>
          </p>
          {form.status === 'ACTIVE' && (
            <p className="text-xs text-blue-600 font-medium pt-1">
              This running contract is the source for payroll calculation in the active period.
            </p>
          )}
        </div>

        {isNew && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.employeeId}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Creating…' : 'Create Contract'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
