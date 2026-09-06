'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { EmployeeAvatar } from '@/components/employees/employee-avatar';
import { api } from '@/lib/api';
import { Building2, Users } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

interface DepartmentGroup {
  name: string;
  members: Employee[];
}

export default function DepartmentsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Employee[]>('/employees');
        if (res.success && res.data) setEmployees(res.data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const departments = useMemo<DepartmentGroup[]>(() => {
    const map = new Map<string, Employee[]>();
    for (const emp of employees) {
      const key = emp.department?.trim() || 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(emp);
    }
    return Array.from(map.entries())
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [employees]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Departments</h1>
        <p className="text-xs text-slate-500">
          Grouped from each employee&apos;s department field — head count &amp; roster per department.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading departments…
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <Link
              key={dept.name}
              href={`/dashboard/employees?search=${encodeURIComponent(dept.name)}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm leading-tight truncate">{dept.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {dept.members.length} {dept.members.length === 1 ? 'employee' : 'employees'}
                  </div>
                </div>
              </div>

              <div className="flex items-center -space-x-2 pt-3 border-t border-slate-100">
                {dept.members.slice(0, 6).map((m) => (
                  <EmployeeAvatar
                    key={m.id}
                    firstName={m.firstName}
                    lastName={m.lastName}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
                {dept.members.length > 6 && (
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    +{dept.members.length - 6}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
