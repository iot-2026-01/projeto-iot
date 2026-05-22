import { useCallback, useEffect, useRef, useState } from 'react';
import { getTelemetry, type ApiError } from '../api/loadBalancer';
import type { TelemetryData } from '../types';

const POLL_INTERVAL_MS = 2000;
const FETCH_TIMEOUT_MS = 5000;
const CONSECUTIVE_FAILURES_THRESHOLD = 3;

export interface UseTelemetryResult {
  data: TelemetryData | null;
  loading: boolean;
  error: ApiError | null;
  connectionUnavailable: boolean;
  triggerPoll: () => void;
}

export function useTelemetry(): UseTelemetryResult {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [connectionUnavailable, setConnectionUnavailable] = useState<boolean>(false);

  const consecutiveFailuresRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTelemetry = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const result = await getTelemetry(controller.signal);
      clearTimeout(timeoutId);

      // Success: reset failure tracking and clear error states
      consecutiveFailuresRef.current = 0;
      setData(result);
      setError(null);
      setConnectionUnavailable(false);
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);

      consecutiveFailuresRef.current += 1;
      const apiError = err as ApiError;
      setError(apiError);
      setLoading(false);

      if (consecutiveFailuresRef.current >= CONSECUTIVE_FAILURES_THRESHOLD) {
        setConnectionUnavailable(true);
      }
    }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchTelemetry, POLL_INTERVAL_MS);
  }, [fetchTelemetry]);

  const triggerPoll = useCallback(() => {
    // Reset interval and fire an immediate fetch
    startInterval();
    fetchTelemetry();
  }, [startInterval, fetchTelemetry]);

  useEffect(() => {
    // Initial fetch on mount
    fetchTelemetry();
    // Start polling interval
    startInterval();

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchTelemetry, startInterval]);

  return { data, loading, error, connectionUnavailable, triggerPoll };
}
