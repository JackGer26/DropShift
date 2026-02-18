import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {title && (
        <h2 className="text-base font-semibold text-gray-900 mb-5">{title}</h2>
      )}
      {children}
    </div>
  );
}
