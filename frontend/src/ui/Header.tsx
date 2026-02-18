import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/rota':      'Rota Builder',
  '/staff':     'Staff Management',
  '/templates': 'Templates',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/my-rota')) return 'My Rota';
  return PAGE_TITLES[pathname] ?? 'ShiftDrop';
}

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center px-6">
      <h1 className="text-sm font-medium text-gray-700">{getTitle(pathname)}</h1>
    </header>
  );
}
