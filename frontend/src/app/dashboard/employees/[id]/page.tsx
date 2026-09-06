'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmployeeAvatar } from '@/components/employees/employee-avatar';
import { SmartButton } from '@/components/employees/smart-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Mail, Phone, Pencil, Check, X } from 'lucide-react';

interface Contract {
  id: string;
  contractName: string;
  startDate: string;
  endDate: string | null;
  wage: number;
  status: string;
  salaryStructure?: { name: string };
}

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  timeOffType?: { name: string };
}

interface Attendance {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  status: string;
}

interface EmployeeDetail {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string;
  jobPosition: string;
  workingSchedule: string;
  schedule: { id: string; name: string } | null;
  status: string;
  bankName: string | null;
  bankAccountNo: string | null;
  bankRoutingNo: string | null;
  manager: { id: string; firstName: string; lastName: string; jobPosition: string } | null;
  subordinates: { id: string; firstName: string; lastName: string; jobPosition: string }[];
  user: { id: string; email: string; role: string } | null;
  contracts: Contract[];
  timeOffRequests: TimeOffRequest[];
}

type Panel = 'info' | 'contracts' | 'attendance' | 'timeoff';
type InfoTab = 'work' | 'private';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>('info');
  const [infoTab, setInfoTab] = useState<InfoTab>('work');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<EmployeeDetail>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [workingSchedules, setWorkingSchedules] = useState<{ id: string; name: string }[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const [empRes, attRes, scheduleRes] = await Promise.all([
        api.get<EmployeeDetail>(`/employees/${id}`),
        api.get<Attendance[]>(`/attendances?employeeId=${id}`),
        api.get<{ id: string; name: string }[]>('/working-schedules'),
      ]);
      if (empRes.success && empRes.data) {
        setEmployee(empRes.data);
        setForm(empRes.data);
        setSelectedScheduleId(empRes.data.schedule?.id ?? '');
      }
      if (attRes.success && attRes.data) setAttendances(attRes.data);
      if (scheduleRes.success && scheduleRes.data) setWorkingSchedules(scheduleRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEdit = () => {
    setForm(employee ?? {});
    setSelectedScheduleId(employee?.schedule?.id ?? '');
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm(employee ?? {});
    setSelectedScheduleId(employee?.schedule?.id ?? '');
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!employee) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.put(`/employees/${employee.id}`, {
        department: form.department,
        jobPosition: form.jobPosition,
        workingSchedule: form.workingSchedule,
        scheduleId: selectedScheduleId || null,
        status: form.status,
        phone: form.phone,
        bankName: form.bankName,
        bankAccountNo: form.bankAccountNo,
        bankRoutingNo: form.bankRoutingNo,
      });
      if (res.success) {
        setIsEditing(false);
        load();
      } else {
        setSaveError(res.error || 'Failed to save changes');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: keyof EmployeeDetail) => (form as any)[key] ?? '';
  const updateField = (key: keyof EmployeeDetail) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading employee…</div>;
  }

  if (!employee) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Employee not found.</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push('/dashboard/employees')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Employee / <span className="text-slate-900">{employee.firstName} {employee.lastName}</span>
      </button>

      {/* Actions & smart buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} className="rounded-xl" disabled={isSaving}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startEdit} className="rounded-xl self-start sm:self-auto">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        )}

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <SmartButton
            label="Time Off"
            count={employee.timeOffRequests?.length ?? 0}
            active={panel === 'timeoff'}
            onClick={() => setPanel(panel === 'timeoff' ? 'info' : 'timeoff')}
          />
          <SmartButton
            label="Contracts"
            count={employee.contracts?.length ?? 0}
            active={panel === 'contracts'}
            onClick={() => setPanel(panel === 'contracts' ? 'info' : 'contracts')}
          />
          <SmartButton
            label="Attendance"
            count={attendances.length}
            active={panel === 'attendance'}
            onClick={() => setPanel(panel === 'attendance' ? 'info' : 'attendance')}
          />
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <EmployeeAvatar firstName={employee.firstName} lastName={employee.lastName} size="lg" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {employee.firstName} {employee.lastName}
              </h1>
              <StatusBadge status={employee.status} />
            </div>
            <div className="text-xs text-brand-600 font-medium">
              {employee.jobPosition} • {employee.department}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {employee.email}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> {employee.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {panel === 'info' && (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setInfoTab('work')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  infoTab === 'work' ? 'text-brand-600 border-brand-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                Work Information
              </button>
              <button
                onClick={() => setInfoTab('private')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  infoTab === 'private' ? 'text-brand-600 border-brand-600' : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                Private Information
              </button>
            </div>

            {infoTab === 'work' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <FormField label="Department" value={field('department')} editing={isEditing} onChange={updateField('department')} />
                <FormField label="Job Position" value={field('jobPosition')} editing={isEditing} onChange={updateField('jobPosition')} />
                <FormField
                  label="Manager"
                  value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—'}
                  editing={false}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 font-medium">Working Schedule</Label>
                  {isEditing ? (
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">— No structured schedule —</option>
                      {workingSchedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : employee.schedule ? (
                    <Link
                      href={`/dashboard/working-schedules/${employee.schedule.id}`}
                      className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-brand-600 font-medium hover:underline"
                    >
                      {employee.schedule.name}
                    </Link>
                  ) : (
                    <Input value={employee.workingSchedule} disabled className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
                  )}
                </div>
                <FormField label="Employee Code" value={employee.employeeCode} editing={false} />
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 font-medium">Status</Label>
                  {isEditing ? (
                    <select
                      value={field('status')}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ON_LEAVE">ON_LEAVE</option>
                    </select>
                  ) : (
                    <Input value={field('status')} disabled className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
                  )}
                </div>
                <FormField label="Work Email" value={employee.email} editing={false} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <FormField label="Phone" value={field('phone')} editing={isEditing} onChange={updateField('phone')} />
                <FormField
                  label="Linked User Account"
                  value={employee.user ? `${employee.user.email} (${employee.user.role})` : '—'}
                  editing={false}
                />
                <FormField label="Bank Name" value={field('bankName')} editing={isEditing} onChange={updateField('bankName')} />
                <FormField label="Bank Account No." value={field('bankAccountNo')} editing={isEditing} onChange={updateField('bankAccountNo')} />
                <FormField label="Bank Routing No." value={field('bankRoutingNo')} editing={isEditing} onChange={updateField('bankRoutingNo')} />
              </div>
            )}

            {saveError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {saveError}
              </div>
            )}
          </>
        )}

        {panel === 'contracts' && (
          <PanelTable
            title="Contracts"
            emptyLabel="No contracts recorded for this employee."
            columns={['Contract', 'Start', 'End', 'Wage', 'Status']}
            rows={employee.contracts?.map((c) => [
              c.contractName,
              new Date(c.startDate).toLocaleDateString(),
              c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Indefinite',
              `$${c.wage.toLocaleString()}`,
              <StatusBadge key={c.id} status={c.status} />,
            ])}
          />
        )}

        {panel === 'timeoff' && (
          <PanelTable
            title="Time Off Requests"
            emptyLabel="No time off requests submitted."
            columns={['Type', 'Start', 'End', 'Days', 'Status']}
            rows={employee.timeOffRequests?.map((r) => [
              r.timeOffType?.name ?? '—',
              new Date(r.startDate).toLocaleDateString(),
              new Date(r.endDate).toLocaleDateString(),
              `${r.totalDays}`,
              <StatusBadge key={r.id} status={r.status} />,
            ])}
          />
        )}

        {panel === 'attendance' && (
          <PanelTable
            title="Attendance Log"
            emptyLabel="No attendance entries recorded."
            columns={['Date', 'Check-In', 'Check-Out', 'Worked Hours', 'Status']}
            rows={attendances.map((a) => [
              new Date(a.date).toLocaleDateString(),
              new Date(a.checkIn).toLocaleTimeString(),
              a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'In Progress',
              `${a.workedHours} hrs`,
              <StatusBadge key={a.id} status={a.status} />,
            ])}
          />
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400 font-medium">{label}</Label>
      <Input
        value={value ?? ''}
        onChange={onChange}
        disabled={!editing || !onChange}
        className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:cursor-default"
      />
    </div>
  );
}

function PanelTable({
  title,
  emptyLabel,
  columns,
  rows,
}: {
  title: string;
  emptyLabel: string;
  columns: string[];
  rows?: React.ReactNode[][];
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="p-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-400">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="p-3 text-slate-700 font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
