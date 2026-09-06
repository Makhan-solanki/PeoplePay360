'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
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

  return (
    <div className="w-full max-w-[440px] mx-auto bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl text-card-foreground">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs p-3 rounded-xl"
            role="alert"
            id="login-error"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs font-medium">
            Work Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-xl h-11"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-xl h-11"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl mt-2"
          disabled={isLoading}
          id="login-submit"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Accounts are created and provisioned by an administrator.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          After sign-in, show only the modules and actions allowed by the user&apos;s assigned role.
        </p>
      </div>
    </div>
  );
}
