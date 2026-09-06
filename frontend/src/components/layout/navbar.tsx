'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Sparkles, LayoutDashboard, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md"
      id="main-navbar"
    >
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo matching ChronoTask Mockup Icon */}
        <Link href="/" className="flex items-center space-x-3 group" id="navbar-logo">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="grid grid-cols-2 gap-1 p-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-200"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            People<span className="text-brand-600">Pay360</span>
          </span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse bg-muted rounded-full" />
          ) : isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-sm flex items-center gap-2"
                  id="navbar-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Workspace</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="rounded-full text-muted-foreground hover:text-foreground"
                id="navbar-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  id="navbar-login"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="rounded-full bg-brand-600 hover:bg-brand-700 text-white px-5 shadow-sm shadow-brand-500/20 font-medium"
                  id="navbar-get-demo"
                >
                  Enter Portal
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
