'use client';

import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-4xl text-center space-y-8 py-20">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Hackathon 2026
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Production-grade full-stack boilerplate. Auth, RBAC, API envelope, structured logging,
            file uploads — everything you need to win.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" id="home-dashboard-btn">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" id="home-register-btn">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" id="home-login-btn">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {[
              {
                title: 'Auth & RBAC',
                desc: 'JWT access/refresh tokens, secure cookies, role-based access control.',
              },
              {
                title: 'API Standards',
                desc: 'Consistent { success, data, error } envelope, Zod validation, rate limiting.',
              },
              {
                title: 'Production Ready',
                desc: 'Structured logging, health checks, Docker, CI/CD — battle-tested from day one.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
