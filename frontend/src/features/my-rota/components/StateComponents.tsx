/**
 * State Components - Loading, Error, Empty states
 * Reusable presentational components for different states
 */

import React from 'react';

/**
 * Loading State
 */
export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-9 h-9 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin mb-4" />
      <p className="text-sm text-gray-500">Loading your schedule...</p>
    </div>
  );
};

/**
 * Error State
 */
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-4xl mb-4 opacity-70" aria-hidden="true">⚠️</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Schedule</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * Empty State
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Rotas Found',
  message = "You don't have any published rotas yet. Check back later or contact your manager.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4 opacity-40" aria-hidden="true">📅</span>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">{message}</p>
    </div>
  );
};
