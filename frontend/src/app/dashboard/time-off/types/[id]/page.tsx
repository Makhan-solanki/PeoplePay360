'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { timeOffTypeMeta } from '@/lib/time-off-type-meta';
import { ArrowLeft, Check, X, Pencil } from 'lucide-react';

interface TimeOffTypeDetail {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
}

export default function TimeOffTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [type, setType] = useState<TimeOffTypeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('Standard leave policy. Balance comes from approved allocations.');

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<TimeOffTypeDetail[]>('/time-off/types');
    if (res.success && res.data) {
      const found = res.data.find((t) => t.id === id) ?? null;
      setType(found);
      if (found) {
        setName(found.name);
        setIsPaid(found.isPaid);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancelEdit = () => {
    if (type) {
      setName(type.name);
      setIsPaid(type.isPaid);
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!type) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.put(`/time-off/types/${type.id}`, { name, isPaid });
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

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading time off type…</div>;
  }

  if (!type) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Time off type not found.</div>;
  }

  const meta = timeOffTypeMeta({ code: type.code, isPaid });

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/time-off/types')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Time Off Type / <span className="text-slate-900">{type.name}</span>
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving} className="rounded-xl">
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isSaving} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="w-3.5 h-3.5 mr-1" /> {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        {saveError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{saveError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Type Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Approval</Label>
            <Input disabled value={meta.approval} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Unit</Label>
            <Input disabled value={meta.unit} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Payroll / Work Entry</Label>
            <Input disabled value={meta.payrollWorkEntry} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Requires Allocation</Label>
            {isEditing ? (
              <select
                value={isPaid ? 'yes' : 'no'}
                onChange={(e) => setIsPaid(e.target.value === 'yes')}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="yes">Required</option>
                <option value="no">No</option>
              </select>
            ) : (
              <Input disabled value={meta.requiresAllocation} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Display Color</Label>
            <Input disabled value={meta.displayColor} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Active</Label>
            <Input disabled value={meta.status === 'Active' ? 'True' : 'False'} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-700">Configuration Notes</div>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">{notes}</p>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Time Off Type drives approval behavior and whether a request needs an allocation.
        </p>
      </div>
    </div>
  );
}
