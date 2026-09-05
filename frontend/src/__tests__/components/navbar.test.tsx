import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Default mock for useAuth — logged out state
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Navbar', () => {
  describe('Logged Out', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('should render logo', async () => {
      const { Navbar } = await import('@/components/layout/navbar');
      render(<Navbar />);
      expect(screen.getByText('Hackathon 2026')).toBeInTheDocument();
    });

    it('should show Login and Sign Up when not authenticated', async () => {
      const { Navbar } = await import('@/components/layout/navbar');
      render(<Navbar />);
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });
  });

  describe('Logged In', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@hack.dev', role: 'USER' },
        isAuthenticated: true,
        isLoading: false,
        logout: mockLogout,
      });
    });

    it('should show user email and logout when authenticated', async () => {
      const { Navbar } = await import('@/components/layout/navbar');
      render(<Navbar />);
      expect(screen.getByText('test@hack.dev')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should show Admin link for admin users', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@hack.dev', role: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { Navbar } = await import('@/components/layout/navbar');
      render(<Navbar />);
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });
});
