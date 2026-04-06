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

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Generates past month options dynamically (2-7 months ago) */
function getPastMonthOptions(): TimeWindow[] {
  const now = toZonedTime(new Date(), TZ);
  const options: TimeWindow[] = [];
  for (let i = 2; i <= 7; i++) {
    const m = subMonths(now, i);
    const label = `${MONTH_LABELS[m.getMonth()]}/${String(m.getFullYear()).slice(2)}`;
    options.push({ label, value: `month_${i}` });
  }
  return options;
}

/** Available time window options */
export const TIME_WINDOWS: TimeWindow[] = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: '3 dias', value: '3d' },
  { label: '5 dias', value: '5d' },
  { label: '7 dias', value: '7d' },
  { label: '14 dias', value: '14d' },
  { label: '30 dias', value: '30d' },
  { label: 'Este mês', value: 'this_month' },
  { label: 'Mês passado', value: 'last_month' },
  ...getPastMonthOptions(),
];

interface UseTimeWindowResult {
  window: string;
  startDate: string;
  endDate: string;
  compare: boolean;
  customStart: string;
  customEnd: string;
  setWindow: (value: string) => void;
  setCompare: (value: boolean) => void;
  setCustomRange: (start: string, end: string) => void;
}

/**
 * Hook that manages the selected time window and computes
 * startDate / endDate in YYYY-MM-DD format using Sao Paulo timezone.
 */
export function useTimeWindow(defaultWindow = '7d', minDate?: string): UseTimeWindowResult {
  const [window, setWindow] = useState(defaultWindow);
  const [compare, setCompare] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { startDate, endDate } = useMemo(() => {
    const nowUTC = new Date();
    const now = toZonedTime(nowUTC, TZ);
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);

    if (window === 'custom' && customStart && customEnd) {
      let sd = customStart;
      if (minDate && sd < minDate) sd = minDate;
      return { startDate: sd, endDate: customEnd };
    }

    let start: Date;
    let end: Date;

    switch (window) {
      case 'today':
        start = today;
        end = today;
        break;

      case 'yesterday':
        start = yesterday;
        end = yesterday;
        break;

      case '3d':
        start = subDays(yesterday, 2);
        end = yesterday;
        break;

      case '5d':
        start = subDays(yesterday, 4);
        end = yesterday;
        break;

      case '7d':
        start = subDays(yesterday, 6);
        end = yesterday;
        break;

      case '14d':
        start = subDays(yesterday, 13);
        end = yesterday;
        break;

      case '30d':
        start = subDays(yesterday, 29);
        end = yesterday;
        break;

      case 'this_month':
        start = startOfMonth(today);
        end = yesterday;
        break;

      case 'last_month': {
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      }

      default: {
        // Handle month_N (N months ago)
        const monthMatch = window.match(/^month_(\d+)$/);
        if (monthMatch) {
          const n = parseInt(monthMatch[1], 10);
          const target = subMonths(today, n);
          start = startOfMonth(target);
          end = endOfMonth(target);
        } else {
          start = subDays(yesterday, 6);
          end = yesterday;
        }
        break;
      }
    }

    let sd = format(start, 'yyyy-MM-dd');
    if (minDate && sd < minDate) sd = minDate;

    return {
      startDate: sd,
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, [window, customStart, customEnd, minDate]);

  const setCustomRange = useCallback((start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setWindow('custom');
  }, []);

  return {
    window,
    startDate,
    endDate,
    compare,
    customStart,
    customEnd,
    setWindow,
    setCompare,
    setCustomRange,
  };
}
