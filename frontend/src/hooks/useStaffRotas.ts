import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStaffRotas, StaffRotaItem } from '../services/rota.service';

/**
 * Custom hook for fetching staff-facing rotas
 *
 * This hook demonstrates:
 * - Separation of concerns: Data fetching logic isolated from UI
 * - Reusability: Can be used across multiple components
 * - Proper effect dependencies: Prevents unnecessary re-fetching
 * - Cleanup: Cancels in-flight requests on unmount
 * - Error handling: Graceful error management
 *
 * @param staffId - The staff member's ID
 * @param from - Optional start date (YYYY-MM-DD)
 * @param to - Optional end date (YYYY-MM-DD)
 * @returns {rotas, loading, error, refetch}
 */

interface UseStaffRotasParams {
  staffId: string;
  from?: string;
  to?: string;
}

interface UseStaffRotasReturn {
  rotas: StaffRotaItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStaffRotas({ staffId, from, to }: UseStaffRotasParams): UseStaffRotasReturn {
  // State management
  const [rotas, setRotas] = useState<StaffRotaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);

  // Track current request (for cancellation)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized fetch function
  // useCallback prevents infinite re-renders by maintaining function reference
  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await fetchStaffRotas({ staffId, from, to });
      console.log('📊 Staff rotas response:', response);
      console.log('📊 Number of rotas:', response.rotas?.length);
      console.log('📊 First rota:', response.rotas?.[0]);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setRotas(response.rotas);
        setLoading(false);
      }
    } catch (err: any) {
      // Don't set error state if request was aborted (expected behavior)
      if (err.name === 'AbortError' || err.message?.includes('cancel')) {
        return;
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch rotas');
        setLoading(false);
      }
    }
  }, [staffId, from, to]); // Re-create function only when params change

  // Effect: Fetch data when parameters change
  useEffect(() => {
    // Reset mounted flag
    isMountedRef.current = true;

    // Fetch data
    fetchData();

    // Cleanup: Mark as unmounted and cancel any in-flight requests
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]); // Dependency on fetchData (which depends on staffId, from, to)

  // Refetch function for manual refresh
  // useCallback prevents unnecessary re-renders in consuming components
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    rotas,
    loading,
    error,
    refetch
  };
}
