'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { CheckInModal } from '@/components/attendance/check-in-modal';
import { PlusCircle, Search, X, CalendarCheck } from 'lucide-react';

interface AttendanceRow {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  status: string;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; department: string };
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');

  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeIdFilter) params.set('employeeId', employeeIdFilter);
      if (todayOnly) {
        params.set('startDate', todayIso());
        params.set('endDate', todayIso());
      }
      const qs = params.toString();
      const res = await api.get<AttendanceRow[]>(`/attendances${qs ? `?${qs}` : ''}`);
      if (res.success && res.data) setAttendances(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeIdFilter, todayOnly]);

  useEffect(() => {
    api.get<EmployeeOption[]>('/employees').then((res) => {
      if (res.success && res.data) setEmployees(res.data);
    });
  }, []);

  const filteredEmployee = employeeIdFilter ? employees.find((e) => e.id === employeeIdFilter) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendances;
    return attendances.filter((a) =>
      [a.employee?.firstName, a.employee?.lastName, a.employee?.employeeCode, a.employee?.department]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [attendances, search]);

  const clearEmployeeFilter = () => {
    router.push('/dashboard/attendance');
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Attendance</h1>
            <p className="text-xs text-slate-500">List view of employee attendance records.</p>
          </div>
          <Button
            onClick={() => setShowCheckInModal(true)}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search attendance..."
              className="pl-9 rounded-xl border-slate-200 h-10"
            />
          </div>
          <button
            onClick={() => setTodayOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
              todayOnly
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Today
          </button>
          {filteredEmployee && (
            <button
              onClick={clearEmployeeFilter}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold whitespace-nowrap"
            >
              Employee: {filteredEmployee.firstName}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading attendance…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          No attendance records found.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Check In</th>
                  <th className="p-3">Check Out</th>
                  <th className="p-3">Worked Hours</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((att) => (
                  <tr
                    key={att.id}
                    onClick={() => router.push(`/dashboard/attendance/${att.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-slate-900">
                      {att.employee?.firstName} {att.employee?.lastName}
                      <div className="text-[10px] text-slate-400 font-normal">{att.employee?.department}</div>
                    </td>
                    <td className="p-3 text-slate-600">{new Date(att.date).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-slate-600">
                      {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 font-semibold text-blue-600">{att.workedHours.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <StatusBadge status={att.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCheckInModal && (
        <CheckInModal
          employees={employees}
          onClose={() => setShowCheckInModal(false)}
          onCheckedIn={() => {
            setShowCheckInModal(false);
            loadAttendances();
          }}
        />
      )}
    </div>
  );
}
