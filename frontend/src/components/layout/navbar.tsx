'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" id="main-navbar">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2" id="navbar-logo">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Hackathon 2026
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
          ) : isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" id="navbar-dashboard">Dashboard</Button>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" id="navbar-admin">Admin</Button>
                </Link>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground" id="navbar-user-email">
                  {user?.email}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full" id="navbar-user-role">
                  {user?.role}
                </span>
              </div>
              <Button variant="outline" onClick={logout} id="navbar-logout">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" id="navbar-login">Login</Button>
              </Link>
              <Link href="/register">
                <Button id="navbar-register">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
