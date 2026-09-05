import React from 'react';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { AppTopbar } from '@/components/shared/app-topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
        <AppTopbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
