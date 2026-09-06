import type { Metadata } from 'next';
import { AuthNavbarGate } from '@/components/layout/auth-navbar-gate';

export const metadata: Metadata = {
  title: 'Login — Hackathon 2026',
  description: 'Sign in to your Hackathon 2026 account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbarGate />
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
