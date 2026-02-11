import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Staff } from './pages/Staff';
import { Templates } from './pages/Templates';
import { RotaBuilder } from './pages/RotaBuilder';
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
