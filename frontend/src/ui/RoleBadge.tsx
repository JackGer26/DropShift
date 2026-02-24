import React from 'react';
import { Role } from '@/types/staff';

const ROLE_STYLES: Record<string, string> = {
  [Role.Manager]:          'bg-violet-100 text-violet-700',
  [Role.AssistantManager]: 'bg-blue-100 text-blue-700',
  [Role.SalesAssistant]:   'bg-teal-100 text-teal-700',
};

const ROLE_ABBREV: Record<string, string> = {
  [Role.Manager]:          'Mgr',
  [Role.AssistantManager]: 'AM',
  [Role.SalesAssistant]:   'SA',
};

interface RoleBadgeProps {
  role: string;
  abbreviated?: boolean;
}

export function RoleBadge({ role, abbreviated = false }: RoleBadgeProps) {
  const styles = ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600';
  const label  = abbreviated ? (ROLE_ABBREV[role] ?? role) : role;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${styles}`}>
      {label}
    </span>
  );
}
