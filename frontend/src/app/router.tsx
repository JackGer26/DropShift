import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { DashboardPage } from '@/features/dashboard';
import { StaffPage } from '@/features/staff-management';
import { TemplatesPage } from '@/features/templates';
import { RotaBuilderPage } from '@/features/rota-builder';
import { MyRotaPage } from '@/features/my-rota';
import { AppLayout } from '@/ui/AppLayout';

function MyRotaPageWrapper() {
  const { staffId } = useParams<{ staffId: string }>();
  if (!staffId) return <div>Error: Staff ID is required</div>;
  return <MyRotaPage staffId={staffId} />;
}

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="rota" element={<RotaBuilderPage />} />
        <Route path="my-rota/:staffId" element={<MyRotaPageWrapper />} />
      </Route>
    </Routes>
  );
}