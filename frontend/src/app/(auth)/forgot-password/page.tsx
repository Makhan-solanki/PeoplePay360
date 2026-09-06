'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend endpoint exists for self-service password reset yet
    // (there's no forgot-password route in backend/src/modules/auth). Show an
    // honest "not wired yet" notice instead of silently no-op'ing or faking success.
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-[440px] mx-auto bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl text-card-foreground">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Reset your password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your work email and we&apos;ll help you get back in.
        </p>
      </div>

      {submitted ? (
        <div
          className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Self-service password reset isn&apos;t wired up yet. Please contact your HR
            administrator to have your password reset.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-xs font-medium">
              Work Email
            </Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-xl h-11"
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl mt-2" id="forgot-password-submit">
            Send reset instructions
          </Button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-border text-center">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>
      </div>
    </div>
  );
}
