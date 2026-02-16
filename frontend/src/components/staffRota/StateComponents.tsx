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
    <div style={styles.container}>
      <div style={styles.spinner}>
        <div style={styles.spinnerCircle}></div>
      </div>
      <p style={styles.message}>Loading your schedule...</p>
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
    <div style={styles.container}>
      <div style={styles.errorIcon}>⚠️</div>
      <h3 style={styles.errorTitle}>Unable to Load Schedule</h3>
      <p style={styles.errorMessage}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={styles.retryButton}>
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
  message = 'You don\'t have any published rotas yet. Check back later or contact your manager.'
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.emptyIcon}>📅</div>
      <h3 style={styles.emptyTitle}>{title}</h3>
      <p style={styles.emptyMessage}>{message}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  } as React.CSSProperties,

  // Loading
  spinner: {
    marginBottom: '16px',
  } as React.CSSProperties,
  spinnerCircle: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2196F3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  message: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,

  // Error
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  } as React.CSSProperties,
  errorTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#d32f2f',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  errorMessage: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    maxWidth: '400px',
  } as React.CSSProperties,
  retryButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  } as React.CSSProperties,

  // Empty
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5,
  } as React.CSSProperties,
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  emptyMessage: {
    fontSize: '14px',
    color: '#666',
    maxWidth: '400px',
    lineHeight: 1.5,
  } as React.CSSProperties,
};

// Add CSS animation for spinner (in production, use CSS file)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
