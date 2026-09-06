'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { timeOffTypeMeta } from '@/lib/time-off-type-meta';
import { NewTypeModal } from '@/components/time-off/new-type-modal';
import { Search, PlusCircle } from 'lucide-react';

interface TimeOffTypeRow {
  id: string;
  name: string;
  code: string;
  isPaid: boolean;
}

export default function TimeOffTypesPage() {
  const router = useRouter();
  const [types, setTypes] = useState<TimeOffTypeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTypes = async () => {
    setIsLoading(true);
    const res = await api.get<TimeOffTypeRow[]>('/time-off/types');
    if (res.success && res.data) setTypes(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    return types.filter((t) => t.name.toLowerCase().includes(q));
  }, [types, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Time Off Types</h1>
          <p className="text-xs text-slate-500">List view opened from Time Off ▼ → Time off Types.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
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
              placeholder="Search time off types..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading types…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No time off types found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Allocation</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => {
                  const meta = timeOffTypeMeta(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/dashboard/time-off/types/${t.id}`)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900">{t.name}</td>
                      <td className="p-3 text-slate-600">{meta.unit}</td>
                      <td className="p-3 text-slate-600">{meta.requiresAllocation}</td>
                      <td className="p-3 text-slate-600">{meta.approval}</td>
                      <td className="p-3 text-right">
                        <StatusBadge status={meta.status.toUpperCase()} label={meta.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <NewTypeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            router.push(`/dashboard/time-off/types/${id}`);
          }}
        />
      )}
    </div>
  );
}
