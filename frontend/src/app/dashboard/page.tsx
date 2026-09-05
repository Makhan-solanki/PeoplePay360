'use client';

import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8">
          <DashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" id="dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" id="dashboard-role">{user?.role}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono truncate" id="dashboard-id">{user?.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-lg font-semibold" id="dashboard-status">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-muted-foreground">
            This is your protected dashboard. The boilerplate is ready — start building
            your hackathon features on top of this foundation. Add new routes in{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">backend/src/modules/</code>{' '}
            and new pages in{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">frontend/src/app/</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
