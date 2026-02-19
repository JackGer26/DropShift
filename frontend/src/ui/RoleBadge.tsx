import React from 'react';
import { Role } from '@/types/staff';

const ROLE_STYLES: Record<string, string> = {
  [Role.Manager]:          'bg-violet-100 text-violet-700',
  [Role.AssistantManager]: 'bg-blue-100 text-blue-700',
  [Role.SalesAssistant]:   'bg-teal-100 text-teal-700',
};

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const styles = ROLE_STYLES[role] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${styles}`}>
      {role}
    </span>
  );
}
