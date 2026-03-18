import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { TimeWindow } from '../types';

const TZ = 'America/Sao_Paulo';

/* ===== Generic data-fetching hook ===== */

interface UseGA4DataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for fetching data from API endpoints.
 *
 * @param fetcher - Async function that returns the data.
 * @param deps - Dependency array that triggers refetch when changed.
 */
export function useGA4Data<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[]
): UseGA4DataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCount, setRefetchCount] = useState(0);

  const refetch = useCallback(() => {
    setRefetchCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchCount]);

  return { data, loading, error, refetch };
}

/* ===== Time Window Hook ===== */

/** Available time window options */
export const TIME_WINDOWS: TimeWindow[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: '7 dias', value: '7d' },
  { label: '14 dias', value: '14d' },
  { label: '30 dias', value: '30d' },
  { label: 'Este m\u00eas', value: 'this_month' },
  { label: 'M\u00eas passado', value: 'last_month' },
];

interface UseTimeWindowResult {
  window: string;
  startDate: string;
  endDate: string;
  compare: boolean;
  setWindow: (value: string) => void;
  setCompare: (value: boolean) => void;
}

/**
 * Hook that manages the selected time window and computes
 * startDate / endDate in YYYY-MM-DD format using Sao Paulo timezone.
 */
export function useTimeWindow(defaultWindow = '7d'): UseTimeWindowResult {
  const [window, setWindow] = useState(defaultWindow);
  const [compare, setCompare] = useState(false);

  const { startDate, endDate } = useMemo(() => {
    const nowUTC = new Date();
    const now = toZonedTime(nowUTC, TZ);
    const today = startOfDay(now);

    let start: Date;
    let end: Date;

    switch (window) {
      case 'today':
        start = today;
        end = today;
        break;

      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;

      case '7d':
        start = subDays(today, 6);
        end = today;
        break;

      case '14d':
        start = subDays(today, 13);
        end = today;
        break;

      case '30d':
        start = subDays(today, 29);
        end = today;
        break;

      case 'this_month':
        start = startOfMonth(today);
        end = today;
        break;

      case 'last_month': {
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      }

      default:
        start = subDays(today, 6);
        end = today;
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, [window]);

  return {
    window,
    startDate,
    endDate,
    compare,
    setWindow,
    setCompare,
  };
}
