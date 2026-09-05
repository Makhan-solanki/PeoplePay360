'use client';

import { Navbar } from '@/components/layout/navbar';
import { ProtectedRoute } from '@/components/shared/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold" id="admin-title">Admin Panel</h1>
              <p className="text-muted-foreground mt-1">
                This page is only accessible to administrators.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Access Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" id="admin-content">
                  You have ADMIN role privileges. This page demonstrates RBAC working
                  end-to-end. Users with the USER role will see an &ldquo;Access Denied&rdquo; message.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
