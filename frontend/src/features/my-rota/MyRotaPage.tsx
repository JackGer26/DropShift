import React, { useEffect, useMemo, useState } from 'react';
import { useStaffRotas } from './useStaffRotas';
import { transformRotasToWeeks } from '@/utils/rotaUtils';
import { fetchLocations } from '@/services/location.service';
import { Location } from '@/types/location';
import { RotaList } from './components/RotaList';
import { LoadingState, ErrorState } from './components/StateComponents';
import { EmptyState } from '@/ui';

interface MyRotaPageProps {
  staffId: string;
}

export const MyRotaPage: React.FC<MyRotaPageProps> = ({ staffId }) => {
  const [dateRange] = useState(() => {
    // Go back 4 weeks so past rotas are fetched and can be shown greyed-out
    const now = new Date();
    const past = new Date(now);
    past.setDate(now.getDate() - 28);
    const future = new Date(now);
    future.setDate(now.getDate() + 8 * 7);
    return {
      from: past.toISOString().split('T')[0],
      to: future.toISOString().split('T')[0],
    };
  });
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchLocations().then(setLocations).catch(() => {});
  }, []);

  const { rotas, loading, error, refetch } = useStaffRotas({
    staffId,
    from: dateRange.from,
    to: dateRange.to,
  });

  const weekGroups = useMemo(() => {
    if (!rotas || rotas.length === 0) return [];
    const weeks = transformRotasToWeeks(rotas);
    return weeks.map(w => {
      const weekEnd = new Date(w.weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);
      return {
        ...w,
        locationName: locations.find(l => l._id === w.locationId)?.name,
        isPast: new Date() > weekEnd,
      };
    }).sort((a, b) => {
      // Active weeks first, past weeks last
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
      // Active: ascending (nearest first); Past: descending (most recently ended first)
      const dir = a.isPast ? -1 : 1;
      return dir * a.weekStartDate.localeCompare(b.weekStartDate);
    });
  }, [rotas, locations]);

  const totals = useMemo(() => {
    const activeWeeks = weekGroups.filter(w => !w.isPast);
    const totalHours = activeWeeks.reduce((sum, week) => sum + week.totalHours, 0);
    const totalShifts = activeWeeks.reduce((sum, week) => sum + week.totalShifts, 0);
    return { totalHours, totalShifts, activeWeekCount: activeWeeks.length };
  }, [weekGroups]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* Page Header */}
      <header className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View your published shifts</p>
      </header>

      {/* Summary Bar */}
      {!loading && !error && weekGroups.length > 0 && (
        <div className="flex flex-wrap justify-around gap-4 p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl mb-6">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Hours</span>
            <span className="text-2xl font-semibold text-gray-900">{totals.totalHours}h</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Shifts</span>
            <span className="text-2xl font-semibold text-gray-900">{totals.totalShifts}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">Weeks</span>
            <span className="text-2xl font-semibold text-gray-900">{totals.activeWeekCount}</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={refetch}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="min-h-[400px]">
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {!loading && !error && weekGroups.length === 0 && (
          <EmptyState
            title="No rotas found"
            description="You don't have any published rotas yet. Check back later or contact your manager."
          />
        )}

        {!loading && !error && weekGroups.length > 0 && (
          <RotaList weeks={weekGroups} />
        )}
      </main>
    </div>
  );
};
