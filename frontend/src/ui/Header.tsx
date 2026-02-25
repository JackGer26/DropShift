import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '@/services/auth.service';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/rota':      'Rota Builder',
  '/staff':     'Staff Management',
  '/templates': 'Templates',
  '/locations': 'Locations',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/my-rota')) return 'My Rota';
  return PAGE_TITLES[pathname] ?? 'ShiftDrop';
}

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center gap-3 px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-sm font-medium text-gray-700 flex-1">{getTitle(pathname)}</h1>

      <button
        onClick={handleLogout}
        className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
