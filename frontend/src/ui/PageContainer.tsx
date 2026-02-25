import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
      {title && (
        <h2 className="text-base font-semibold text-gray-900 mb-5">{title}</h2>
      )}
      {children}
    </div>
  );
}
