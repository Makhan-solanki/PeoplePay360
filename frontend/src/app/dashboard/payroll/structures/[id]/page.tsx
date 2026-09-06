'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ArrowLeft, Check, X, Pencil } from 'lucide-react';

interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
}

interface SalaryStructureDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  rules: SalaryRule[];
}

export default function SalaryStructureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [structure, setStructure] = useState<SalaryStructureDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<SalaryStructureDetail[]>('/payroll/structures');
    if (res.success && res.data) {
      const found = res.data.find((s) => s.id === id) ?? null;
      setStructure(found);
      if (found) {
        setName(found.name);
        setDescription(found.description ?? '');
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancelEdit = () => {
    if (structure) {
      setName(structure.name);
      setDescription(structure.description ?? '');
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!structure) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.put(`/payroll/structures/${structure.id}`, { name, description: description || null });
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
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading structure…</div>;
  }

  if (!structure) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Salary structure not found.</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/payroll/structures')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Salary Structure / <span className="text-slate-900">{structure.name}</span>
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isSaving} className="rounded-xl">
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isSaving} className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
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
            <Label className="text-xs text-slate-400 font-medium">Structure Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Code</Label>
            <Input disabled value={structure.code} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400 font-medium">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditing}
            className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-brand-600">Salary Rules</div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Rule Name</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Sequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {structure.rules.map((rule) => (
                    <tr
                      key={rule.id}
                      onClick={() => router.push(`/dashboard/payroll/rules/${rule.id}`)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-800">{rule.name}</td>
                      <td className="p-3 text-slate-500 font-mono">{rule.code}</td>
                      <td className="p-3 text-slate-500">{rule.category}</td>
                      <td className="p-3 text-right text-slate-500">{rule.sequence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Rule order matters — sequence determines calculation order. Open a rule to edit it individually.
        </p>
      </div>
    </div>
  );
}
