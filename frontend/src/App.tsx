import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Staff } from './pages/Staff';
import { Templates } from './pages/Templates';
import { RotaBuilder } from './pages/RotaBuilder';
import { MyRotaPage } from './pages/MyRotaPage';
import { AppLayout } from './components/common/AppLayout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="staff" element={<Staff />} />
          <Route path="templates" element={<Templates />} />
          <Route path="rota" element={<RotaBuilder />} />

          {/* Staff-facing route with dynamic staffId */}
          <Route path="my-rota/:staffId" element={<MyRotaPageWrapper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper component to extract staffId from URL
function MyRotaPageWrapper() {
  const { staffId } = useParams<{ staffId: string }>();

  if (!staffId) {
    return <div>Error: Staff ID is required</div>;
  }

  return <MyRotaPage staffId={staffId} />;
}

// Import useParams hook
import { useParams } from 'react-router-dom';
