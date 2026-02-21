import React from 'react';

interface CardProps {
  title?:         string;
  description?:   string;
  actions?:       React.ReactNode;
  className?:     string;
  bodyClassName?: string;
  children?:      React.ReactNode;
}

export function Card({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: CardProps) {
  const hasHeader = title || actions;

  return (
    <div
      className={[
        'bg-white border border-gray-200 rounded-lg overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hasHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            {title && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={bodyClassName ?? 'p-4'}>{children}</div>
    </div>
  );
}
