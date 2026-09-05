'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  PlusCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  LogOut,
  Building,
  Check,
  X
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainWorkspace />
    </ProtectedRoute>
  );
}

function MainWorkspace() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'payroll' | 'employees' | 'contracts' | 'attendance' | 'timeoff'>('payroll');

  // Domain State
  const [employees, setEmployees] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [payruns, setPayruns] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);

  // Selected Payrun / Wizard State
  const [selectedPayrun, setSelectedPayrun] = useState<any | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Today attendance state
  const [todayPunch, setTodayPunch] = useState<any | null>(null);

  // Load Initial Data
  const loadData = async () => {
    try {
      const [empRes, attRes, toRes, prRes, strRes] = await Promise.all([
        api.get<any[]>('/employees'),
        api.get<any[]>('/attendances'),
        api.get<any[]>('/time-off/requests'),
        api.get<any[]>('/payroll/payruns'),
        api.get<any[]>('/payroll/structures'),
      ]);

      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (attRes.success && attRes.data) setAttendances(attRes.data);
      if (toRes.success && toRes.data) setTimeOffRequests(toRes.data);
      if (prRes.success && prRes.data) {
        setPayruns(prRes.data);
        if (prRes.data.length > 0 && !selectedPayrun) {
          loadPayrunDetails(prRes.data[0].id);
        }
      }
      if (strRes.success && strRes.data) setSalaryStructures(strRes.data);
    } catch (err) {
      console.error('Error loading workspace data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadPayrunDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/payroll/payruns/${id}`);
      if (res.success && res.data) {
        setSelectedPayrun(res.data);
        if (res.data.payslips?.length > 0) {
          setSelectedPayslip(res.data.payslips[0]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleCheckIn = async (empId: string) => {
    try {
      const res = await api.post('/attendances/check-in', { employeeId: empId });
      if (res.success) {
        setActionSuccess('Check-in recorded successfully!');
        loadData();
      } else {
        setActionError(res.error || 'Failed to check in');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleCheckOut = async (empId: string) => {
    try {
      const res = await api.post('/attendances/check-out', { employeeId: empId });
      if (res.success) {
        setActionSuccess('Check-out recorded and hours computed!');
        loadData();
      } else {
        setActionError(res.error || 'Failed to check out');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleApproveLeave = async (requestId: string) => {
    try {
      const res = await api.patch(`/time-off/requests/${requestId}/approve`);
      if (res.success) {
        setActionSuccess('Time off approved & allocation balance atomically deducted!');
        loadData();
      } else {
        setActionError(res.error || 'Failed to approve');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleRejectLeave = async (requestId: string) => {
    try {
      const res = await api.patch(`/time-off/requests/${requestId}/reject`, {
        rejectionNote: 'Rejected by Manager',
      });
      if (res.success) {
        setActionSuccess('Time off request rejected');
        loadData();
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  // Payrun Wizard Step 1 & 2
  const handleCreatePayrunDemo = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

      const structId = salaryStructures[0]?.id;
      if (!structId) return;

      // 1. Create Payrun
      const newPayrunRes = await api.post<any>('/payroll/payruns', {
        name: `Payroll - Month ${monthStr}/${currentYear}`,
        periodStartDate: `${currentYear}-${monthStr}-01`,
        periodEndDate: `${currentYear}-${monthStr}-28`,
        salaryStructureId: structId,
      });

      if (!newPayrunRes.success || !newPayrunRes.data) {
        throw new Error(newPayrunRes.error || 'Failed to create payrun');
      }

      // 2. Generate Payslips for all employees
      const empIds = employees.map((e) => e.id);
      const generatedRes = await api.post<any>(`/payroll/payruns/${newPayrunRes.data.id}/generate`, {
        employeeIds: empIds,
      });

      if (generatedRes.success && generatedRes.data) {
        setSelectedPayrun(generatedRes.data);
        if (generatedRes.data.payslips?.length > 0) {
          setSelectedPayslip(generatedRes.data.payslips[0]);
        }
        setActionSuccess('Payrun batch initialized and computed in sequential rule order!');
        loadData();
      }
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidatePayrun = async (payrunId: string) => {
    try {
      const res = await api.post<any>(`/payroll/payruns/${payrunId}/validate`);
      if (res.success) {
        setSelectedPayrun(res.data);
        setActionSuccess('Payrun successfully validated and locked for disbursement!');
        loadData();
      } else {
        setActionError(res.error || 'Validation failed');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const handleMarkPaid = async (payrunId: string) => {
    try {
      const res = await api.post<any>(`/payroll/payruns/${payrunId}/pay`);
      if (res.success) {
        setSelectedPayrun(res.data);
        setActionSuccess('Payrun marked as PAID! All employee payslips confirmed.');
        loadData();
      } else {
        setActionError(res.error || 'Disbursement failed');
      }
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <div className="grid grid-cols-2 gap-1 p-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight">
            People<span className="text-blue-600">Pay360</span> <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium ml-1">ERP</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'payroll' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payrun & Payslips</span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'employees' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employees ({employees.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('timeoff')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'timeoff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Time Off</span>
          </button>
        </nav>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900">{user?.email}</div>
            <div className="text-[10px] text-blue-600 font-medium">{user?.role}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="rounded-xl text-slate-500 hover:text-slate-900">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Notifications Bar */}
      {actionSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex justify-between items-center animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs text-rose-800 flex justify-between items-center animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: PAYROLL (KILLER DEMO FEATURE) */}
        {/* ========================================================================= */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            {/* Top Payroll Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Payroll Execution & Rule Engine</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compute rule-driven payslips from active contracts with sequential validation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreatePayrunDemo}
                  disabled={isLoading}
                  size="sm"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Payrun Run</span>
                </Button>
              </div>
            </div>

            {/* Payrun Processing Workspace */}
            {selectedPayrun ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Payrun Summary & Status */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Payrun Name</div>
                      <div className="text-base font-bold text-slate-900">{selectedPayrun.name}</div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        selectedPayrun.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedPayrun.status === 'VALIDATED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedPayrun.status}
                    </span>
                  </div>

                  {/* Financial Aggregates */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Gross</div>
                      <div className="text-sm font-bold text-slate-900">${selectedPayrun.totalGross.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Deductions</div>
                      <div className="text-sm font-bold text-rose-600">-${selectedPayrun.totalDeductions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Net</div>
                      <div className="text-sm font-bold text-blue-600">${selectedPayrun.totalNet.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Payrun Actions */}
                  <div className="space-y-2 pt-2">
                    {selectedPayrun.status === 'COMPUTED' && (
                      <Button
                        onClick={() => handleValidatePayrun(selectedPayrun.id)}
                        className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs h-10 font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Validate & Lock Payrun
                      </Button>
                    )}
                    {selectedPayrun.status === 'VALIDATED' && (
                      <Button
                        onClick={() => handleMarkPaid(selectedPayrun.id)}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 font-semibold shadow-md shadow-emerald-500/20"
                      >
                        <DollarSign className="w-4 h-4 mr-1.5" /> Mark Batch as PAID
                      </Button>
                    )}
                  </div>

                  {/* Employee Payslips List */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Generated Payslips ({selectedPayrun.payslips?.length || 0})
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {selectedPayrun.payslips?.map((slip: any) => (
                        <div
                          key={slip.id}
                          onClick={() => setSelectedPayslip(slip)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            selectedPayslip?.id === slip.id
                              ? 'bg-blue-50/60 border-blue-400 text-blue-950 font-semibold'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div>
                            <div>{slip.employee?.firstName} {slip.employee?.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{slip.employee?.department}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">${slip.netPay.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">Net Pay</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Selected Payslip Itemized Breakdown */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  {selectedPayslip ? (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Payslip: {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Employee ID: {selectedPayslip.employee?.employeeCode} • Position: {selectedPayslip.employee?.jobPosition}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                            Contract Base: ${selectedPayslip.basicWage?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div>
                        <div className="text-xs font-semibold text-slate-700 mb-2">Sequential Salary Rule Breakdown</div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="p-3">Sequence</th>
                                <th className="p-3">Rule Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 text-right">Computed Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedPayslip.lineItems?.map((item: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className={
                                    item.category === 'GROSS'
                                      ? 'bg-slate-50/80 font-bold text-slate-900'
                                      : item.category === 'NET'
                                      ? 'bg-blue-50/50 font-bold text-blue-900'
                                      : item.category === 'DEDUCTION'
                                      ? 'text-rose-600'
                                      : 'text-slate-700'
                                  }
                                >
                                  <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="p-3 font-medium">{item.name} ({item.ruleCode})</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        item.category === 'BASIC'
                                          ? 'bg-slate-100 text-slate-700'
                                          : item.category === 'ALLOWANCE'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : item.category === 'DEDUCTION'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-semibold">
                                    ${item.amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Net Pay Highlight Banner */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-500/10">
                        <div>
                          <div className="text-xs font-medium text-blue-100">Final Net Disbursement</div>
                          <div className="text-2xl font-black">${selectedPayslip.netPay?.toLocaleString()}</div>
                        </div>
                        <div className="text-right text-xs text-blue-100">
                          <div>Bank: {selectedPayslip.employee?.bankName || 'Missing'}</div>
                          <div>A/C: {selectedPayslip.employee?.bankAccountNo || 'Missing'}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      Select a payslip to view the rule-driven computation breakdown.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-500 mb-4">No active payruns found. Click below to start the demo payrun.</p>
                <Button onClick={handleCreatePayrunDemo} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Run Initial Payrun Demo
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EMPLOYEES DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Employee Master Directory</h2>
                <p className="text-xs text-slate-500">Active contracts, salary structure, and status overview.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {employees.map((emp) => (
                <div key={emp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-base">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-blue-600 font-medium">{emp.jobPosition}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      {emp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between"><span>Code:</span> <span className="font-semibold text-slate-900">{emp.employeeCode}</span></div>
                    <div className="flex justify-between"><span>Department:</span> <span className="font-semibold text-slate-900">{emp.department}</span></div>
                    <div className="flex justify-between"><span>Active Contract:</span> <span className="font-semibold text-blue-600">${emp.contracts?.[0]?.wage || 0}/mo</span></div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCheckIn(emp.id)}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs rounded-xl border-slate-200"
                    >
                      Punch In
                    </Button>
                    <Button
                      onClick={() => handleCheckOut(emp.id)}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs rounded-xl border-slate-200"
                    >
                      Punch Out
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ATTENDANCE */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attendance Log & Hours Computed</h2>
                <p className="text-xs text-slate-500">Live check-in/out timestamps and auto-calculated worked hours.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Worked Hours</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">No attendance entries recorded yet.</td>
                    </tr>
                  ) : (
                    attendances.map((att) => (
                      <tr key={att.id}>
                        <td className="p-3 font-semibold text-slate-900">
                          {att.employee?.firstName} {att.employee?.lastName}
                        </td>
                        <td className="p-3 text-slate-600">{new Date(att.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600">{new Date(att.checkIn).toLocaleTimeString()}</td>
                        <td className="p-3 text-slate-600">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString() : 'In Progress'}</td>
                        <td className="p-3 font-semibold text-blue-600">{att.workedHours} hrs</td>
                        <td className="p-3 text-right">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TIME OFF (LEAVE MANAGEMENT & ATOMIC DEDUCTION) */}
        {/* ========================================================================= */}
        {activeTab === 'timeoff' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Time Off Requests & Leave Balances</h2>
                <p className="text-xs text-slate-500">Atomic allocation balance lock on approval.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Start Date</th>
                    <th className="p-3">End Date</th>
                    <th className="p-3">Total Days</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeOffRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">No time off requests submitted.</td>
                    </tr>
                  ) : (
                    timeOffRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="p-3 font-semibold text-slate-900">{req.employee?.firstName} {req.employee?.lastName}</td>
                        <td className="p-3 text-slate-600">{req.timeOffType?.name}</td>
                        <td className="p-3 text-slate-600">{new Date(req.startDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600">{new Date(req.endDate).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-blue-600">{req.totalDays} days</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => handleApproveLeave(req.id)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-7 text-[11px] px-2"
                              >
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectLeave(req.id)}
                                size="sm"
                                variant="outline"
                                className="rounded-lg h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
