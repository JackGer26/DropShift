import React, { useState } from 'react';
import { useStaffRotas } from '@/features/my-rota/useStaffRotas';

/**
 * Example 1: Simple usage - Display all published rotas for a staff member
 */
export function StaffRotaList({ staffId }: { staffId: string }) {
  const { rotas, loading, error, refetch } = useStaffRotas({ staffId });

  if (loading) {
    return <div>Loading your schedule...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (rotas.length === 0) {
    return <div>No published rotas found.</div>;
  }

  return (
    <div>
      <h2>Your Schedule</h2>
      <button onClick={refetch}>Refresh</button>

      {rotas.map((rota, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
          <h3>Week of {rota.weekStartDate}</h3>
          <p>Location: {rota.locationId}</p>
          <ul>
            {rota.shifts.map((shift, shiftIndex) => (
              <li key={shiftIndex}>
                Day {shift.dayOfWeek}: Shift {shift.shiftTemplateId}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: With date range filtering
 */
export function StaffRotaCalendar({ staffId }: { staffId: string }) {
  const [dateRange, setDateRange] = useState({
    from: '2026-02-01',
    to: '2026-03-31'
  });

  const { rotas, loading, error } = useStaffRotas({
    staffId,
    from: dateRange.from,
    to: dateRange.to
  });

  return (
    <div>
      <h2>Schedule Calendar</h2>

      {/* Date range selector */}
      <div>
        <label>
          From:
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
        </label>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div>
          <p>{rotas.length} rota(s) found</p>
          {rotas.map((rota, index) => (
            <div key={index}>
              <strong>{rota.weekStartDate}</strong>: {rota.shifts.length} shift(s)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Upcoming shifts only (from today onwards)
 */
export function UpcomingShifts({ staffId }: { staffId: string }) {
  const today = new Date().toISOString().split('T')[0];

  const { rotas, loading, error } = useStaffRotas({
    staffId,
    from: today
  });

  const totalShifts = rotas.reduce((sum, rota) => sum + rota.shifts.length, 0);

  return (
    <div>
      <h2>Upcoming Shifts</h2>

      {loading && <div className="spinner">Loading...</div>}

      {error && (
        <div className="error-banner">
          <p>Unable to load shifts: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <div className="summary">
            <p>You have <strong>{totalShifts}</strong> upcoming shifts across <strong>{rotas.length}</strong> weeks</p>
          </div>

          {rotas.map((rota) => (
            <div key={rota.weekStartDate} className="rota-card">
              <h3>{formatWeekDate(rota.weekStartDate)}</h3>
              <div className="shift-grid">
                {rota.shifts.map((shift, idx) => (
                  <div key={idx} className="shift-badge">
                    {getDayName(shift.dayOfWeek)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: With custom loading and error components
 */
export function StaffRotaWithCustomStates({ staffId }: { staffId: string }) {
  const { rotas, loading, error, refetch } = useStaffRotas({ staffId });

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorAlert message={error} onRetry={refetch} />}
      {!loading && !error && <RotaGrid rotas={rotas} />}
    </div>
  );
}

// Helper components
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div className="spinner">Loading...</div>
    </div>
  );
}

function ErrorAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ backgroundColor: '#fee', padding: '1rem', borderRadius: '4px' }}>
      <p style={{ color: '#c00', margin: 0 }}>{message}</p>
      <button onClick={onRetry} style={{ marginTop: '0.5rem' }}>
        Try Again
      </button>
    </div>
  );
}

function RotaGrid({ rotas }: { rotas: any[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
      {rotas.map((rota, index) => (
        <div key={index} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px' }}>
          <h4>{rota.weekStartDate}</h4>
          <p>{rota.shifts.length} shifts</p>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function formatWeekDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || `Day ${dayOfWeek}`;
}

/**
 * Example 5: Polling for real-time updates
 */
export function LiveStaffRotas({ staffId }: { staffId: string }) {
  const { rotas, loading, error, refetch } = useStaffRotas({ staffId });

  // Poll every 30 seconds for updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Live Schedule</h2>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>
          Auto-refreshing every 30s
        </span>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <div>
          <p>{rotas.length} active rotas</p>
          {/* Render rotas */}
        </div>
      )}
    </div>
  );
}
