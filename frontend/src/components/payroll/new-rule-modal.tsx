'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface StructureOption {
  id: string;
  name: string;
}

interface NewRuleModalProps {
  structures: StructureOption[];
  defaultStructureId?: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}

type Method = 'PERCENTAGE' | 'FIXED';

export function NewRuleModal({ structures, defaultStructureId, onClose, onCreated }: NewRuleModalProps) {
  const [structureId, setStructureId] = useState(defaultStructureId ?? structures[0]?.id ?? '');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('ALLOWANCE');
  const [sequence, setSequence] = useState(10);
  const [method, setMethod] = useState<Method>('PERCENTAGE');
  const [percentage, setPercentage] = useState('20');
  const [fixedAmount, setFixedAmount] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<{ id: string }>(`/payroll/structures/${structureId}/rules`, {
        name,
        code: code.toUpperCase(),
        category,
        sequence,
        percentage: method === 'PERCENTAGE' ? Number(percentage) / 100 : null,
        fixedAmount: method === 'FIXED' ? Number(fixedAmount) : null,
      });
      if (res.success && res.data) {
        onCreated(res.data.id);
      } else {
        setError(res.error || 'Failed to create salary rule');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create salary rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsAmount = category === 'ALLOWANCE' || category === 'DEDUCTION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold text-slate-900">New Salary Rule</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Salary Structure</Label>
            <select
              value={structureId}
              onChange={(e) => setStructureId(e.target.value)}
              required
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rule Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Meal Allowance" />
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="e.g. MEAL" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="BASIC">Basic</option>
                <option value="ALLOWANCE">Allowance</option>
                <option value="DEDUCTION">Deduction</option>
                <option value="GROSS">Gross</option>
                <option value="NET">Net</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Sequence</Label>
              <Input type="number" value={sequence} onChange={(e) => setSequence(Number(e.target.value))} required />
            </div>
          </div>

          {needsAmount && (
            <div className="space-y-1.5">
              <Label>Computation</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('PERCENTAGE')}
                  className={`flex-1 h-9 rounded-xl text-xs font-semibold border ${method === 'PERCENTAGE' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                >
                  Percentage of Wage
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('FIXED')}
                  className={`flex-1 h-9 rounded-xl text-xs font-semibold border ${method === 'FIXED' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                >
                  Fixed Amount
                </button>
              </div>
              {method === 'PERCENTAGE' ? (
                <Input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="20" />
              ) : (
                <Input type="number" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="200" />
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Creating…' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
