'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Check, X } from 'lucide-react';

interface TimeOffRequestDetail {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string | null;
  rejectionNote: string | null;
  employee: { id: string; firstName: string; lastName: string };
  timeOffType: { id: string; name: string };
  decidedBy: { id: string; email: string; employee: { firstName: string; lastName: string } | null } | null;
}

function approverLabel(decidedBy: TimeOffRequestDetail['decidedBy']) {
  if (!decidedBy) return '—';
  return decidedBy.employee ? `${decidedBy.employee.firstName} ${decidedBy.employee.lastName}` : decidedBy.email;
}

export default function TimeOffRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] = useState<TimeOffRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<TimeOffRequestDetail[]>('/time-off/requests');
    if (res.success && res.data) {
      setRequest(res.data.find((r) => r.id === id) ?? null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleApprove = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${request.id}/approve`);
    if (res.success) load();
    else setActionError(res.error || 'Failed to approve request');
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setActionError(null);
    const res = await api.patch(`/time-off/requests/${request.id}/reject`, { rejectionNote: 'Rejected by manager' });
    if (res.success) load();
    else setActionError(res.error || 'Failed to reject request');
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading request…</div>;
  }

  if (!request) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Time off request not found.</div>;
  }

  const allocationUsed = `${request.timeOffType.name} ${new Date(request.startDate).getFullYear()}`;

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <button
        onClick={() => router.push('/dashboard/time-off/requests')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Time Off Request / <span className="text-slate-900">{request.employee.firstName} {request.employee.lastName}</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {actionError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{actionError}</div>
        )}

        {request.status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Approve
            </Button>
            <Button onClick={handleReject} disabled={isSubmitting} variant="outline" size="sm" className="rounded-xl">
              <X className="w-3.5 h-3.5 mr-1" /> Refuse
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Employee</Label>
            <Input
              disabled
              value={`${request.employee.firstName} ${request.employee.lastName}`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Duration</Label>
            <Input
              disabled
              value={`${request.totalDays} ${request.totalDays === 1 ? 'Day' : 'Days'}`}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Time Off Type</Label>
            <Input
              disabled
              value={request.timeOffType.name}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Status</Label>
            <div className="flex h-10 items-center">
              <StatusBadge status={request.status} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Start Date</Label>
            <Input
              disabled
              value={new Date(request.startDate).toLocaleDateString()}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Approver</Label>
            <Input
              disabled
              value={approverLabel(request.decidedBy)}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">End Date</Label>
            <Input
              disabled
              value={new Date(request.endDate).toLocaleDateString()}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Allocation Used</Label>
            <Input
              disabled
              value={allocationUsed}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-700">Reason</div>
          <p className="text-xs text-slate-500 leading-relaxed">{request.reason || 'No reason provided.'}</p>
          {request.status === 'REJECTED' && request.rejectionNote && (
            <p className="text-xs text-rose-600 pt-1">Rejection note: {request.rejectionNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
