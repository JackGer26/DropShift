import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '@/services/auth.service';

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
