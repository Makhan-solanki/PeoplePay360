'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

interface NewTypeModalProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewTypeModal({ onClose, onCreated }: NewTypeModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<{ id: string }>('/time-off/types', { name, code: code.toUpperCase(), isPaid });
      if (res.success && res.data) {
        onCreated(res.data.id);
      } else {
        setError(res.error || 'Failed to create time off type');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create time off type');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">New Time Off Type</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
          )}

          <div className="space-y-1.5">
            <Label>Type Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Comp Off" />
          </div>

          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="e.g. CO" />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="rounded border-slate-300" />
            Paid leave (tracks an allocated balance)
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Creating…' : 'Create Type'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
