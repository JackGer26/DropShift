/**
 * MyRotaPage - Staff-facing read-only rota display
 *
 * This is a SMART CONTAINER component that:
 * - Manages state and effects
 * - Fetches data with custom hook
 * - Derives computed data with useMemo
 * - Passes data down to presentational components
 *
 * Demonstrates:
 * - Container/Presentational pattern
 * - Proper memoization to prevent unnecessary re-renders
 * - Separation of business logic (utils) from presentation (components)
 * - Clean component composition
 */

import React, { useMemo, useState } from 'react';
import { useStaffRotas } from '../hooks/useStaffRotas';
import { transformRotasToWeeks, getUpcomingWeeksRange } from '../utils/rotaUtils';
import { RotaList } from '../components/staffRota/RotaList';
import { LoadingState, ErrorState, EmptyState } from '../components/staffRota/StateComponents';

interface MyRotaPageProps {
  staffId: string;
}

export const MyRotaPage: React.FC<MyRotaPageProps> = ({ staffId }) => {
  // Date range state (could be controlled by date picker)
  const [dateRange, setDateRange] = useState(() => getUpcomingWeeksRange(8));

  // Fetch data using custom hook
  const { rotas, loading, error, refetch } = useStaffRotas({
    staffId,
    from: dateRange.from,
    to: dateRange.to
  });

  // DERIVED STATE: Transform API data into display-ready format
  // useMemo prevents expensive computation on every render
  // Only recalculates when `rotas` changes
  const weekGroups = useMemo(() => {
    if (!rotas || rotas.length === 0) return [];
    return transformRotasToWeeks(rotas);
  }, [rotas]);

  // DERIVED STATE: Calculate totals
  // Memoized to prevent recalculation on unrelated re-renders
  const totals = useMemo(() => {
    const totalHours = weekGroups.reduce((sum, week) => sum + week.totalHours, 0);
    const totalShifts = weekGroups.reduce((sum, week) => sum + week.totalShifts, 0);
    return { totalHours, totalShifts };
  }, [weekGroups]);

  // RENDER: Conditional rendering based on state
  return (
    <div className="my-rota-page" style={styles.container}>
      {/* Page Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>My Schedule</h1>
        <p style={styles.subtitle}>View your published shifts</p>
      </header>

      {/* Summary Bar (only show when we have data) */}
      {!loading && !error && weekGroups.length > 0 && (
        <div style={styles.summaryBar}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Hours</span>
            <span style={styles.summaryValue}>{totals.totalHours}h</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Shifts</span>
            <span style={styles.summaryValue}>{totals.totalShifts}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Weeks</span>
            <span style={styles.summaryValue}>{weekGroups.length}</span>
          </div>
          <button onClick={refetch} style={styles.refreshButton}>
            Refresh
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main style={styles.content}>
        {/* Loading State */}
        {loading && <LoadingState />}

        {/* Error State */}
        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {/* Empty State */}
        {!loading && !error && weekGroups.length === 0 && (
          <EmptyState />
        )}

        {/* Data Display */}
        {!loading && !error && weekGroups.length > 0 && (
          <RotaList weeks={weekGroups} />
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  } as React.CSSProperties,
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#222',
    margin: '0 0 8px 0',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,
  summaryBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '20px',
    marginBottom: '24px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  summaryValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2196F3',
  } as React.CSSProperties,
  refreshButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#2196F3',
    backgroundColor: 'transparent',
    border: '1px solid #2196F3',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  content: {
    minHeight: '400px',
  } as React.CSSProperties,
};
