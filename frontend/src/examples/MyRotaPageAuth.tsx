/**
 * Production example: My Rota Page with Authentication
 * Gets staffId from authenticated user instead of URL
 */

import React from 'react';
import { MyRotaPage } from '../pages/MyRotaPage';

// Example auth context (you'd implement this)
interface AuthContextType {
  user: {
    id: string;
    role: 'staff' | 'manager' | 'admin';
  } | null;
  loading: boolean;
}

// Mock useAuth hook - replace with your actual auth implementation
function useAuth(): AuthContextType {
  // In production, this would come from your auth provider
  return {
    user: { id: '507f1f77bcf86cd799439011', role: 'staff' },
    loading: false
  };
}

/**
 * Authenticated version of My Rota Page
 * Automatically gets staffId from logged-in user
 */
export function MyRotaPageAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view your schedule.</p>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  // Only staff can view this page
  if (user.role !== 'staff') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>This page is only available to staff members.</p>
      </div>
    );
  }

  return <MyRotaPage staffId={user.id} />;
}

/**
 * Update App.tsx to use authenticated version:
 *
 * import { MyRotaPageAuth } from './examples/MyRotaPageAuth';
 *
 * <Route path="my-schedule" element={<MyRotaPageAuth />} />
 *
 * Then users visit: http://localhost:5173/my-schedule
 * (no staffId in URL - gets it from auth automatically)
 */
