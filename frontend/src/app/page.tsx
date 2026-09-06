'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  DollarSign,
  UserCheck
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-[#1E293B] relative overflow-hidden font-sans selection:bg-brand-500/20">
      {/* Subtle Dot Grid Pattern */}
      <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />

      <Navbar />

      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12 sm:py-20 relative z-10 max-w-6xl mx-auto w-full">
        {/* Center Floating App Icon */}
        <div className="mb-8 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-slate-200/80 border border-slate-100 flex items-center justify-center p-3 animate-bounce-subtle">
            <div className="grid grid-cols-2 gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-500 shadow-sm shadow-brand-500/40"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900"></div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            Think, manage, and pay <br />
            <span className="text-slate-400 font-normal">all in one place</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto font-normal leading-relaxed">
            Automate contracts, time tracking, leave balances, and precision rule-driven payroll calculations seamlessly.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full bg-brand-600 hover:bg-brand-700 text-white font-medium px-8 py-6 text-base shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] flex items-center gap-2"
                id="hero-cta-btn"
              >
                <span>Get free demo</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating Mockup Cards (Faithful to ChronoTask Aesthetic) */}
        <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Card 1: Contracts & Integrity Sticky Note */}
          <div className="bg-[#FEFCE8] border border-amber-200/80 rounded-2xl p-5 shadow-lg shadow-amber-100/50 transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center space-x-2 text-amber-900 font-medium text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Active Contracts</span>
              </div>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">P0 Guard</span>
            </div>
            <p className="text-xs text-amber-800 mt-3 leading-relaxed">
              Enforces non-overlapping active contracts per employee with automatic period resolution for flawless payruns.
            </p>
          </div>

          {/* Card 2: Live Punch & Attendance Reminder */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xl shadow-slate-200/60 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Attendance Log</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="my-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-500">Today&apos;s Status</div>
              <div className="text-sm font-bold text-slate-800 flex items-center justify-between mt-1">
                <span>09:00 AM — In</span>
                <span className="text-xs text-brand-600 font-medium">8.0 hrs</span>
              </div>
            </div>
            <div className="text-xs text-slate-400">Auto-calculates daily hours & half-days</div>
          </div>

          {/* Card 3: Rule-Driven Sequential Payroll */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xl shadow-slate-200/60 transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Sequential Payrun</span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Ready</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Basic:</span> <span className="font-medium text-slate-900">$6,000</span></div>
              <div className="flex justify-between text-brand-600"><span>+ HRA & TRA:</span> <span className="font-medium">+$1,400</span></div>
              <div className="flex justify-between text-rose-500"><span>- PF & Tax:</span> <span className="font-medium">-$1,460</span></div>
              <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900"><span>Net Pay:</span> <span className="text-brand-600">$5,940</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Access Pills */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
            <span>Atomic Leave Balances</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <UserCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Role-Based Access (RBAC)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-brand-600" />
            <span>Pre-Payment Warnings</span>
          </div>
        </div>
      </main>
    </div>
  );
}
