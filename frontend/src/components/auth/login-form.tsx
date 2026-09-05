'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('An unexpected connection error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="w-full max-w-[440px] mx-auto bg-[#14171F] border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-100 selection:bg-blue-500/20">
      {/* Header matching Mockup 2 */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          HR Portal
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="flex items-center gap-2 bg-red-950/50 border border-red-800/80 text-red-300 text-xs p-3 rounded-xl"
            role="alert"
            id="login-error"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs text-slate-300 font-medium">
            Work Email
          </Label>
          <div className="relative">
            <Input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-[#1C202B] border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl h-11 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs text-slate-300 font-medium">
              Password
            </Label>
            <span className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-[#1C202B] border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl h-11 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/30 mt-2 transition-all"
          disabled={isLoading}
          id="login-submit"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Note from Mockup 2 & 3 */}
      <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
        <p className="text-xs text-slate-400">
          Accounts are created and provisioned by an administrator.
        </p>
        <p className="text-[11px] text-slate-500">
          After sign-in, show only the modules and actions allowed by the user&apos;s assigned role.
        </p>
      </div>

      {/* ⚡ Demo Quick-Fill Profiles for Live Demo */}
      <div className="mt-6 pt-4 border-t border-slate-800/60">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
          Demo Test Accounts
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('payroll@peoplepay360.com')}
            className="text-left px-2.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
          >
            <span className="font-semibold text-blue-400 block">Payroll Manager</span>
            payroll@peoplepay360.com
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('hr@peoplepay360.com')}
            className="text-left px-2.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
          >
            <span className="font-semibold text-emerald-400 block">HR Manager</span>
            hr@peoplepay360.com
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('john.doe@peoplepay360.com')}
            className="text-left px-2.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
          >
            <span className="font-semibold text-amber-400 block">Employee (John)</span>
            john.doe@peoplepay360.com
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('jane.smith@peoplepay360.com')}
            className="text-left px-2.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors"
          >
            <span className="font-semibold text-purple-400 block">Employee (Jane)</span>
            jane.smith@peoplepay360.com
          </button>
        </div>
      </div>
    </div>
  );
}
