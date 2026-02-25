import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard';
import { StaffPage } from '@/features/staff-management';
import { TemplatesPage } from '@/features/templates';
import { RotaBuilderPage } from '@/features/rota-builder';
import { MyRotaPage } from '@/features/my-rota';
import { LocationsPage } from '@/features/locations';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppLayout } from '@/ui/AppLayout';

function MyRotaPageWrapper() {
  const { staffId } = useParams<{ staffId: string }>();
  if (!staffId) return <div>Error: Staff ID is required</div>;
  return <MyRotaPage staffId={staffId} />;
}

export function Router() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="my-rota/:staffId" element={<MyRotaPageWrapper />} />

      {/* Protected admin routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="rota" element={<RotaBuilderPage />} />
        </Route>
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">Page not found</p>
          <p className="text-sm text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="text-sm font-medium text-gray-900 underline underline-offset-2">
            Back to dashboard
          </a>
        </div>
      } />
    </Routes>
  );
}