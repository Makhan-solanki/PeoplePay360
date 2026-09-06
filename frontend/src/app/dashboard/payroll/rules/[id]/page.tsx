'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, X, Pencil } from 'lucide-react';

interface SalaryRuleDetail {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  percentage: number | null;
  fixedAmount: number | null;
  conditionRule: string | null;
}

interface SalaryStructure {
  id: string;
  name: string;
  rules: SalaryRuleDetail[];
}

type ComputationMethod = 'FIXED' | 'PERCENTAGE' | 'FORMULA';

function computationMethod(rule: SalaryRuleDetail): ComputationMethod {
  if (rule.percentage !== null) return 'PERCENTAGE';
  if (rule.fixedAmount !== null) return 'FIXED';
  return 'FORMULA';
}

export default function SalaryRuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rule, setRule] = useState<SalaryRuleDetail | null>(null);
  const [structureName, setStructureName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState(0);

  const load = async () => {
    setIsLoading(true);
    const res = await api.get<SalaryStructure[]>('/payroll/structures');
    if (res.success && res.data) {
      for (const structure of res.data) {
        const found = structure.rules.find((r) => r.id === id);
        if (found) {
          setRule(found);
          setStructureName(structure.name);
          setName(found.name);
          setSequence(found.sequence);
          break;
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cancelEdit = () => {
    if (rule) {
      setName(rule.name);
      setSequence(rule.sequence);
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!rule) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.put(`/payroll/rules/${rule.id}`, { name, sequence });
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
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Loading salary rule…</div>;
  }

  if (!rule) {
    return <div className="p-4 sm:p-6 text-sm text-slate-400">Salary rule not found.</div>;
  }

  const method = computationMethod(rule);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => router.push('/dashboard/payroll/rules')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Salary Rule / <span className="text-slate-900">{rule.name}</span>
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
            <Label className="text-xs text-slate-400 font-medium">Rule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Salary Structure</Label>
            <Input disabled value={structureName} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Code</Label>
            <Input disabled value={rule.code} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Computation</Label>
            <Input
              disabled
              value={method === 'FIXED' ? 'Fixed Amount' : method === 'PERCENTAGE' ? 'Percentage of Wage' : 'Python Code'}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Category</Label>
            <Input disabled value={rule.category.charAt(0) + rule.category.slice(1).toLowerCase()} className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">
              {method === 'FIXED' ? 'Fixed Amount' : 'Percentage'}
            </Label>
            <Input
              disabled
              value={method === 'FIXED' ? `$${rule.fixedAmount}` : method === 'PERCENTAGE' ? `${(rule.percentage! * 100).toFixed(0)}%` : '—'}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Sequence</Label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(Number(e.target.value))}
              disabled={!isEditing}
              className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 font-medium">Quantity</Label>
            <Input disabled value="1" className="rounded-xl border-slate-200 disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-bold text-brand-600">Computation options from the source</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={cn(
                'rounded-xl border p-3 space-y-1',
                method === 'FIXED' ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="text-xs font-semibold text-slate-700">Fixed Amount</div>
              <div className="text-[11px] text-slate-500">
                {method === 'FIXED' ? `Uses $${rule.fixedAmount} exactly.` : 'Uses the exact value entered on the rule.'}
              </div>
            </div>
            <div
              className={cn(
                'rounded-xl border p-3 space-y-1',
                method === 'PERCENTAGE' ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="text-xs font-semibold text-slate-700">Percentage of Wage</div>
              <div className="text-[11px] text-slate-500">
                {method === 'PERCENTAGE'
                  ? `${(rule.percentage! * 100).toFixed(0)}% × ${rule.code === 'TAX' ? 'Gross Salary' : 'Basic Salary'}.`
                  : 'Calculates as a percentage of a selected base (Contract Wage, Basic, or Gross).'}
              </div>
            </div>
            <div
              className={cn(
                'rounded-xl border p-3 space-y-1',
                method === 'FORMULA' ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="text-xs font-semibold text-slate-700">Python Code</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {rule.conditionRule || "result = categories['BASIC']"}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          A Salary Rule needs a clear computation method and category because these drive the lines displayed on the
          final payslip.
        </p>
      </div>
    </div>
  );
}
