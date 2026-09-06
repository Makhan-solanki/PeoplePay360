'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';

/**
 * The login page has its own minimal header (see (auth)/login/page.tsx) — the
 * shared site Navbar (brand + Sign in/Enter Portal buttons) is redundant and
 * confusing on the sign-in screen itself, so it's hidden there while staying
 * on other auth routes (e.g. register).
 */
export function AuthNavbarGate() {
  const pathname = usePathname();
  if (pathname === '/login') return null;
  return <Navbar />;
}
