'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, LineChart, StatusSplitBar } from '@/components/payroll/dashboard-charts';
import { DollarSign, FileText, TrendingUp, Calendar, Activity, AlertTriangle } from 'lucide-react';

interface EmployeeRow {
  id: string;
  department: string;
  status: string;
  bankAccountNo: string | null;
  schedule: { calendarType: string } | null;
}

interface ContractRow {
  id: string;
  employeeId: string;
  department: string;
  wage: number;
  status: string;
  endDate: string | null;
}

interface AttendanceRow {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  checkOut: string | null;
  workedHours: number;
}

interface TimeOffTypeRow {
  id: string;
  name: string;
}

interface TimeOffRequestRow {
  id: string;
  employeeId: string;
  status: string;
  totalDays: number;
  startDate: string;
  timeOffType: { id: string; name: string };
}

interface AllocationRow {
  employeeId: string;
  timeOffTypeId: string;
  allocatedDays: number;
  usedDays: number;
  year: number;
}

interface PayslipRow {
  id: string;
  employeeId: string;
  netPay: number;
  grossPay: number;
  status: string;
  employee: { department: string };
}

interface PayrunRow {
  id: string;
  name: string;
  periodStartDate: string;
  periodEndDate: string;
  status: string;
  payslips: PayslipRow[];
}

function periodKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function periodLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatINR(value: number) {
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return `₹${Math.round(value)}`;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: '#10b981',
  DONE: '#3b82f6',
  PENDING: '#f59e0b',
  WARNING: '#f43f5e',
};

export default function PayrollDashboardPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [timeOffTypes, setTimeOffTypes] = useState<TimeOffTypeRow[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequestRow[]>([]);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [payruns, setPayruns] = useState<PayrunRow[]>([]);
  const [company, setCompany] = useState('My Company');
  const [isLoading, setIsLoading] = useState(true);

  const [period, setPeriod] = useState('all');
  const [department, setDepartment] = useState('all');
  const [employeeType, setEmployeeType] = useState('all');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [empRes, contractRes, attRes, typeRes, reqRes, payrunListRes, scheduleRes] = await Promise.all([
        api.get<EmployeeRow[]>('/employees'),
        api.get<ContractRow[]>('/contracts'),
        api.get<AttendanceRow[]>('/attendances'),
        api.get<TimeOffTypeRow[]>('/time-off/types'),
        api.get<TimeOffRequestRow[]>('/time-off/requests'),
        api.get<{ id: string }[]>('/payroll/payruns'),
        api.get<{ company: string }[]>('/working-schedules'),
      ]);

      const emps = empRes.success && empRes.data ? empRes.data : [];
      setEmployees(emps);
      if (contractRes.success && contractRes.data) setContracts(contractRes.data);
      if (attRes.success && attRes.data) setAttendances(attRes.data);
      if (typeRes.success && typeRes.data) setTimeOffTypes(typeRes.data);
      if (reqRes.success && reqRes.data) setTimeOffRequests(reqRes.data);
      if (scheduleRes.success && scheduleRes.data && scheduleRes.data.length > 0) {
        setCompany(scheduleRes.data[0].company);
      }

      const payrunIds = payrunListRes.success && payrunListRes.data ? payrunListRes.data.map((p) => p.id) : [];
      const payrunDetails = await Promise.all(payrunIds.map((id) => api.get<PayrunRow>(`/payroll/payruns/${id}`)));
      setPayruns(payrunDetails.filter((r) => r.success && r.data).map((r) => r.data!));

      const allocationResults = await Promise.all(
        emps.map((e) => api.get<AllocationRow[]>(`/time-off/allocations?employeeId=${e.id}`))
      );
      const flatAllocations: AllocationRow[] = [];
      allocationResults.forEach((res, idx) => {
        if (res.success && res.data) {
          res.data.forEach((a) => flatAllocations.push({ ...a, employeeId: emps[idx].id }));
        }
      });
      setAllocations(flatAllocations);

      setIsLoading(false);
    };
    load();
  }, []);

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const employeeTypes = useMemo(
    () => Array.from(new Set(employees.map((e) => e.schedule?.calendarType ?? 'Standard'))).sort(),
    [employees]
  );
  const periods = useMemo(
    () => Array.from(new Set(payruns.map((p) => periodKey(p.periodStartDate)))).sort().reverse(),
    [payruns]
  );

  const filteredEmployeeIds = useMemo(() => {
    return new Set(
      employees
        .filter((e) => department === 'all' || e.department === department)
        .filter((e) => employeeType === 'all' || (e.schedule?.calendarType ?? 'Standard') === employeeType)
        .map((e) => e.id)
    );
  }, [employees, department, employeeType]);

  const filteredEmployees = useMemo(
    () => employees.filter((e) => filteredEmployeeIds.has(e.id)),
    [employees, filteredEmployeeIds]
  );

  const filteredPayslips = useMemo(() => {
    const rows: (PayslipRow & { periodKey: string; payrunStatus: string })[] = [];
    payruns.forEach((p) => {
      const pk = periodKey(p.periodStartDate);
      if (period !== 'all' && pk !== period) return;
      p.payslips.forEach((slip) => {
        if (!filteredEmployeeIds.has(slip.employeeId)) return;
        rows.push({ ...slip, periodKey: pk, payrunStatus: p.status });
      });
    });
    return rows;
  }, [payruns, period, filteredEmployeeIds]);

  const filteredAttendances = useMemo(
    () =>
      attendances.filter(
        (a) => filteredEmployeeIds.has(a.employeeId) && (period === 'all' || periodKey(a.date) === period)
      ),
    [attendances, filteredEmployeeIds, period]
  );

  const filteredRequests = useMemo(
    () =>
      timeOffRequests.filter(
        (r) => filteredEmployeeIds.has(r.employeeId) && (period === 'all' || periodKey(r.startDate) === period)
      ),
    [timeOffRequests, filteredEmployeeIds, period]
  );

  const filteredContracts = useMemo(
    () => contracts.filter((c) => filteredEmployeeIds.has(c.employeeId) && c.status === 'ACTIVE'),
    [contracts, filteredEmployeeIds]
  );

  // --- KPI cards ---
  const paidPayslips = filteredPayslips.filter((s) => s.status === 'PAID');
  const totalNetPaid = paidPayslips.reduce((sum, s) => sum + s.netPay, 0);

  const prevPeriodKey = useMemo(() => {
    if (period === 'all') return null;
    const idx = periods.indexOf(period);
    return idx >= 0 && idx < periods.length - 1 ? periods[idx + 1] : null;
  }, [period, periods]);

  const prevPeriodTotal = useMemo(() => {
    if (!prevPeriodKey) return null;
    return payruns
      .filter((p) => periodKey(p.periodStartDate) === prevPeriodKey)
      .flatMap((p) => p.payslips)
      .filter((s) => filteredEmployeeIds.has(s.employeeId) && s.status === 'PAID')
      .reduce((sum, s) => sum + s.netPay, 0);
  }, [prevPeriodKey, payruns, filteredEmployeeIds]);

  const netPaidDelta =
    prevPeriodTotal !== null && prevPeriodTotal > 0 ? ((totalNetPaid - prevPeriodTotal) / prevPeriodTotal) * 100 : null;

  const pendingPayslips = filteredPayslips.filter((s) => s.status !== 'PAID').length;
  const avgSalary = filteredPayslips.length > 0 ? filteredPayslips.reduce((s, p) => s + p.netPay, 0) / filteredPayslips.length : 0;
  const approvedLeaveDays = filteredRequests.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.totalDays, 0);
  const attendanceHealthy = filteredAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const attendanceHealth = filteredAttendances.length > 0 ? (attendanceHealthy / filteredAttendances.length) * 100 : 0;

  // --- Salary cost by department ---
  const salaryByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    filteredContracts.forEach((c) => {
      map.set(c.department, (map.get(c.department) ?? 0) + c.wage);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [filteredContracts]);

  // --- Monthly net salary trend (last up to 6 periods present in data) ---
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    payruns.forEach((p) => {
      const pk = periodKey(p.periodStartDate);
      p.payslips
        .filter((s) => filteredEmployeeIds.has(s.employeeId) && s.status === 'PAID')
        .forEach((s) => map.set(pk, (map.get(pk) ?? 0) + s.netPay));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-6)
      .map(([key, value]) => ({ label: periodLabel(key).split(' ')[0], value }));
  }, [payruns, filteredEmployeeIds]);

  // --- Payslip status split + alerts ---
  const statusCounts = useMemo(() => {
    let paid = 0;
    let done = 0;
    let pending = 0;
    filteredPayslips.forEach((s) => {
      if (s.status === 'PAID') paid += 1;
      else if (s.status === 'CONFIRMED') done += 1;
      else pending += 1;
    });
    return { paid, done, pending };
  }, [filteredPayslips]);

  const missingBankCount = filteredEmployees.filter((e) => !e.bankAccountNo).length;
  const draftPayrunCount = useMemo(() => {
    const inPeriod = period === 'all' ? payruns : payruns.filter((p) => periodKey(p.periodStartDate) === period);
    return inPeriod.filter((p) => p.status === 'DRAFT' || p.status === 'COMPUTED').length;
  }, [payruns, period]);

  const expiringContractsCount = useMemo(() => {
    const now = period === 'all' ? new Date() : new Date(`${period}-01T00:00:00.000Z`);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return filteredContracts.filter((c) => {
      if (!c.endDate) return false;
      const end = new Date(c.endDate);
      return end >= monthStart && end <= monthEnd;
    }).length;
  }, [filteredContracts, period]);

  // --- Attendance overview ---
  const attendanceBreakdown = useMemo(() => {
    const present = filteredAttendances.filter((a) => a.status === 'PRESENT').length;
    const halfDay = filteredAttendances.filter((a) => a.status === 'HALF_DAY').length;
    const absent = filteredAttendances.filter((a) => a.status === 'ABSENT').length;
    const overtime = filteredAttendances.filter((a) => a.workedHours > 8).length;
    return [
      { label: 'Present', value: present },
      { label: 'Half Day', value: halfDay },
      { label: 'Absent', value: absent },
      { label: 'Overtime', value: overtime },
    ];
  }, [filteredAttendances]);

  const missingCheckouts = filteredAttendances.filter((a) => !a.checkOut).length;
  const attendanceCoverage =
    filteredAttendances.length > 0
      ? Math.round((filteredAttendances.filter((a) => a.checkOut).length / filteredAttendances.length) * 100)
      : 0;

  // --- Time off overview ---
  const timeOffOverview = useMemo(() => {
    return timeOffTypes.map((t) => {
      const typeRequests = filteredRequests.filter((r) => r.timeOffType.id === t.id);
      const approvedDays = typeRequests.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.totalDays, 0);
      const pendingCount = typeRequests.filter((r) => r.status === 'PENDING').length;
      const typeAllocations = allocations.filter((a) => a.timeOffTypeId === t.id && filteredEmployeeIds.has(a.employeeId));
      const totalAllocated = typeAllocations.reduce((s, a) => s + a.allocatedDays, 0);
      const remaining = typeAllocations.reduce((s, a) => s + (a.allocatedDays - a.usedDays), 0);
      return {
        name: t.name,
        approvedDays,
        pendingCount,
        remaining: totalAllocated > 0 ? `${remaining} Days` : 'N/A',
      };
    });
  }, [timeOffTypes, filteredRequests, allocations, filteredEmployeeIds]);

  // --- Department overview ---
  const departmentOverview = useMemo(() => {
    return departments
      .filter((d) => department === 'all' || d === department)
      .map((d) => {
        const headcount = filteredEmployees.filter((e) => e.department === d).length;
        const monthlySalary = filteredContracts.filter((c) => c.department === d).reduce((s, c) => s + c.wage, 0);
        return { department: d, headcount, monthlySalary };
      });
  }, [departments, department, filteredEmployees, filteredContracts]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Payroll Dashboard</h1>
        <p className="text-xs text-slate-500">
          Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance
          quality for the selected period.
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-background px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {periodLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-background px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Employee Type</label>
            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200 bg-background px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Types</option>
              {employeeTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Company</label>
            <select disabled value={company} className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-500">
              <option>{company}</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-sm text-slate-400">
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Total Net Salary Paid</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{formatINR(totalNetPaid)}</div>
              <div className="text-[10px] text-slate-400">
                {netPaidDelta !== null ? (
                  <span className={netPaidDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {netPaidDelta >= 0 ? '+' : ''}
                    {netPaidDelta.toFixed(1)}% vs previous period
                  </span>
                ) : (
                  'No prior period to compare'
                )}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Payslips Generated</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{filteredPayslips.length}</div>
              <div className="text-[10px] text-slate-400">
                {paidPayslips.length} paid, {pendingPayslips} pending
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-violet-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Avg Salary / Employee</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{formatINR(avgSalary)}</div>
              <div className="text-[10px] text-slate-400">Based on generated payslips</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Approved Time Off Days</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{approvedLeaveDays} Days</div>
              <div className="text-[10px] text-slate-400">Across selected period</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Attendance Health</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{attendanceHealth.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-400">Present / reviewed records</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Salary Cost by Department</div>
              <div className="text-[11px] text-slate-400 mb-2">Source: Contracts + Employee Department</div>
              <BarChart data={salaryByDepartment} formatValue={formatINR} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Monthly Net Salary Trend</div>
              <div className="text-[11px] text-slate-400 mb-2">Source: Historical Payslips / Payruns</div>
              <LineChart data={monthlyTrend} formatValue={formatINR} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <div className="text-sm font-bold text-slate-900">Payslip Status & Payroll Alerts</div>
                <div className="text-[11px] text-slate-400">Source: Payrun + Payslip validation</div>
              </div>
              <StatusSplitBar
                segments={[
                  { label: 'Paid', value: statusCounts.paid, color: STATUS_COLORS.PAID },
                  { label: 'Done', value: statusCounts.done, color: STATUS_COLORS.DONE },
                  { label: 'Pending', value: statusCounts.pending, color: STATUS_COLORS.PENDING },
                ]}
              />
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Current Alerts</div>
                {missingBankCount === 0 && draftPayrunCount === 0 && expiringContractsCount === 0 ? (
                  <p className="text-xs text-slate-400">No active alerts.</p>
                ) : (
                  <>
                    {missingBankCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-600">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {missingBankCount} employee{missingBankCount > 1 ? 's' : ''} missing bank account
                      </div>
                    )}
                    {draftPayrunCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {draftPayrunCount} payrun{draftPayrunCount > 1 ? 's' : ''} still not validated
                      </div>
                    )}
                    {expiringContractsCount > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {expiringContractsCount} contract{expiringContractsCount > 1 ? 's' : ''} expiring this month
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Attendance Overview</div>
              <div className="text-[11px] text-slate-400 mb-2">Source: Attendance</div>
              <BarChart
                data={attendanceBreakdown}
                formatValue={(v) => `${v}`}
                color="#0ea5e9"
              />
              <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-3 space-y-0.5">
                <div>Missing check-outs: <span className="font-semibold text-slate-800">{missingCheckouts}</span></div>
                <div>Attendance coverage: <span className="font-semibold text-slate-800">{attendanceCoverage}%</span></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Time Off Overview</div>
              <div className="text-[11px] text-slate-400 mb-2">Source: Time Off Requests + Allocations</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2 pr-2">Type</th>
                      <th className="py-2 pr-2">Approved</th>
                      <th className="py-2 pr-2">Pending</th>
                      <th className="py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timeOffOverview.map((row) => (
                      <tr key={row.name}>
                        <td className="py-2 pr-2 font-medium text-slate-800">{row.name}</td>
                        <td className="py-2 pr-2 text-slate-600">{row.approvedDays} Days</td>
                        <td className="py-2 pr-2 text-slate-600">{row.pendingCount}</td>
                        <td className="py-2 text-slate-600">{row.remaining}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Department Overview</div>
              <div className="text-[11px] text-slate-400 mb-2">Source: Employee + Contract totals</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2 pr-2">Department</th>
                      <th className="py-2 pr-2">Headcount</th>
                      <th className="py-2">Monthly Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentOverview.map((row) => (
                      <tr key={row.department}>
                        <td className="py-2 pr-2 font-medium text-slate-800">{row.department}</td>
                        <td className="py-2 pr-2 text-slate-600">{row.headcount}</td>
                        <td className="py-2 text-slate-600">{formatINR(row.monthlySalary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
