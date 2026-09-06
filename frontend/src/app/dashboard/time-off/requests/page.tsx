'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { NewRequestModal } from '@/components/time-off/new-request-modal';
import { Search, PlusCircle, Users, Check, X, AlertCircle } from 'lucide-react';

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  managerId: string | null;
}

interface TimeOffTypeOption {
  id: string;
  name: string;
}

interface TimeOffRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  employee: { id: string; firstName: string; lastName: string; department: string };
  timeOffType: { id: string; name: string };
}

export default function TimeOffRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [types, setTypes] = useState<TimeOffTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<TimeOffRequestRow[]>('/time-off/requests');
      if (res.success && res.data) setRequests(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    api.get<EmployeeOption[]>('/employees').then((res) => {
      if (res.success && res.data) setEmployees(res.data);
    });
    api.get<TimeOffTypeOption[]>('/time-off/types').then((res) => {
      if (res.success && res.data) setTypes(res.data);
    });
  }, []);

  const myEmployeeId = useMemo(
    () => employees.find((e) => e.email === user?.email)?.id ?? null,
    [employees, user?.email]
  );
  const myTeamIds = useMemo(
    () => new Set(employees.filter((e) => e.managerId === myEmployeeId).map((e) => e.id)),
    [employees, myEmployeeId]
  );

  const filtered = useMemo(() => {
    let rows = requests;
    if (myTeamOnly) rows = rows.filter((r) => myTeamIds.has(r.employee.id));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.employee.firstName, r.employee.lastName, r.employee.department, r.timeOffType.name]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [requests, myTeamOnly, myTeamIds, search]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${id}/approve`);
    if (res.success) loadRequests();
    else setActionError(res.error || 'Failed to approve request');
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${id}/reject`, { rejectionNote: 'Rejected by manager' });
    if (res.success) loadRequests();
    else setActionError(res.error || 'Failed to reject request');
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      {actionError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 text-xs text-rose-800 flex justify-between items-center">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Time Off Requests</h1>
          <p className="text-xs text-slate-500">List view opened from Time Off ▼ → Requests.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            onClick={() => setShowNewModal(true)}
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
              placeholder="Search requests..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          <button
            onClick={() => setMyTeamOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
              myTeamOnly ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            My Team
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading requests…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          {myTeamOnly ? 'No requests from your direct reports.' : 'No time off requests found.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => router.push(`/dashboard/time-off/requests/${req.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">
                      {req.employee.firstName} {req.employee.lastName}
                      <div className="text-[10px] text-slate-400 font-normal">{req.employee.department}</div>
                    </td>
                    <td className="p-3 text-slate-600">{req.timeOffType.name}</td>
                    <td className="p-3 text-slate-600">{new Date(req.startDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">{new Date(req.endDate).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-brand-600">{req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}</td>
                    <td className="p-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      {req.status === 'PENDING' ? (
                        <>
                          <Button
                            onClick={() => handleApprove(req.id)}
                            size="sm"
                            className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg h-7 text-[11px] px-2"
                          >
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(req.id)}
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-7 text-[11px] px-2"
                          >
                            <X className="w-3 h-3 mr-1" /> Refuse
                          </Button>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewRequestModal
          employees={employees}
          types={types}
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}
