'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, CheckCircle2, Users, AlertCircle } from 'lucide-react';

interface TimeOffRequestRow {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string; department: string };
  timeOffType: { id: string; name: string };
}

function isSameMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isOnLeaveToday(req: TimeOffRequestRow) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  return req.status === 'APPROVED' && start <= today && today <= end;
}

export default function TimeOffDashboardPage() {
  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<TimeOffRequestRow[]>('/time-off/requests');
      if (res.success && res.data) setRequests(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pending = useMemo(() => requests.filter((r) => r.status === 'PENDING'), [requests]);
  const approvedThisMonth = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED' && isSameMonth(r.createdAt)).length,
    [requests]
  );
  const onLeaveToday = useMemo(() => requests.filter(isOnLeaveToday).length, [requests]);

  const handleApprove = async (id: string) => {
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${id}/approve`);
    if (res.success) loadData();
    else setActionError(res.error || 'Failed to approve request');
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${id}/reject`, { rejectionNote: 'Rejected from dashboard' });
    if (res.success) loadData();
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

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Time Off Dashboard</h1>
        <p className="text-xs text-slate-500">Overview of pending approvals, leave activity, and team coverage.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Pending Approvals</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{pending.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Approved This Month</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{approvedThisMonth}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-brand-600">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">On Leave Today</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{onLeaveToday}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pending Approvals</h2>
            <p className="text-xs text-slate-500">Requests waiting on a decision.</p>
          </div>
          <Link href="/dashboard/time-off/requests" className="text-xs font-semibold text-brand-600 hover:underline">
            View all requests
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No pending requests. All caught up!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((req) => (
                  <tr key={req.id}>
                    <td className="p-3 font-semibold text-slate-900">
                      <Link href={`/dashboard/time-off/requests/${req.id}`} className="hover:underline">
                        {req.employee.firstName} {req.employee.lastName}
                      </Link>
                    </td>
                    <td className="p-3 text-slate-600">{req.timeOffType.name}</td>
                    <td className="p-3 text-slate-600">{new Date(req.startDate).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">{new Date(req.endDate).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-brand-600">{req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}</td>
                    <td className="p-3 text-right space-x-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
