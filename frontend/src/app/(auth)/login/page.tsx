'use client';

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background ambient gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mb-6 flex justify-between items-center z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          HR Portal
        </span>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>
      </div>

      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </div>
  );
}
