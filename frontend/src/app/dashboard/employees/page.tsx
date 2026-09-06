'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmployeeAvatar } from '@/components/employees/employee-avatar';
import { EmployeeFormModal } from '@/components/employees/employee-form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { LayoutGrid, List as ListIcon, Search, PlusCircle, Mail } from 'lucide-react';

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobPosition: string;
  status: string;
  contracts?: { wage: number }[];
}

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Employee[]>('/employees');
      if (res.success && res.data) setEmployees(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) =>
      [emp.firstName, emp.lastName, emp.employeeCode, emp.email, emp.jobPosition, emp.department]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [employees, search]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Employees</h1>
          <p className="text-xs text-slate-500">Employee master directory — department, position & status overview.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>

          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading employees…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No employees found.
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((emp) => (
            <button
              key={emp.id}
              onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar firstName={emp.firstName} lastName={emp.lastName} size="md" />
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">{emp.jobPosition}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">{emp.department}</span>
                <StatusBadge status={emp.status} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Work Email</th>
                  <th className="p-3">Job Position</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <EmployeeAvatar firstName={emp.firstName} lastName={emp.lastName} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {emp.email}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{emp.jobPosition}</td>
                    <td className="p-3 text-slate-600">{emp.department}</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={emp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <EmployeeFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}
