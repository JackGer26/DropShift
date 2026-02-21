import React from 'react';

interface EmptyStateProps {
  title:        string;
  description?: string;
  icon?:        React.ReactNode;
  action?:      React.ReactNode;
  className?:   string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-10 px-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && (
        <div className="text-gray-400 w-8 h-8 flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-2 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
