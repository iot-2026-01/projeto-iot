// Feature: iot-dashboard-frontend
// Unit tests for useTelemetry hook
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTelemetry } from '../hooks/useTelemetry';
import type { TelemetryData } from '../types';

const mockTelemetryData: TelemetryData = {
  device: 'esp32-001',
  uptime: 3661,
  events: 42,
  channels: [
    { channel: 'A', currentAmps: 5.5, overload: false, relayActive: true },
    { channel: 'B', currentAmps: 12.3, overload: false, relayActive: true },
    { channel: 'C', currentAmps: 3.1, overload: false, relayActive: true },
  ],
  timestamp: new Date('2024-01-15T10:00:00Z'),
};

vi.mock('../api/loadBalancer', () => ({
  getTelemetry: vi.fn(),
}));

import { getTelemetry } from '../api/loadBalancer';
const mockGetTelemetry = vi.mocked(getTelemetry);

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetTelemetry.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polling starts on mount and stops on unmount', async () => {
    mockGetTelemetry.mockResolvedValue(mockTelemetryData);

    const { unmount } = renderHook(() => useTelemetry());

    // Initial fetch on mount (the hook calls fetchTelemetry immediately)
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const callsAfterMount = mockGetTelemetry.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Advance by one polling interval (2000ms) — should trigger another fetch
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(mockGetTelemetry.mock.calls.length).toBeGreaterThan(callsAfterMount);

    // Unmount should stop polling
    unmount();
    mockGetTelemetry.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(mockGetTelemetry).not.toHaveBeenCalled();
  });

  it('connectionUnavailable becomes true after 3 consecutive failures', async () => {
    const apiError = { type: 'network' as const, message: 'Network error' };
    mockGetTelemetry.mockRejectedValue(apiError);

    const { result } = renderHook(() => useTelemetry());

    // Let the hook process failures until connectionUnavailable becomes true
    // The hook fires an initial fetch + starts interval, so we advance enough
    // for at least 3 failures to accumulate
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });

    // After enough failures, connectionUnavailable should be true
    expect(result.current.connectionUnavailable).toBe(true);
  });

  it('connectionUnavailable clears on next success', async () => {
    const apiError = { type: 'network' as const, message: 'Network error' };
    mockGetTelemetry.mockRejectedValue(apiError);

    const { result } = renderHook(() => useTelemetry());

    // 3 failures to trigger connectionUnavailable
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(result.current.connectionUnavailable).toBe(true);

    // Next success clears it
    mockGetTelemetry.mockResolvedValue(mockTelemetryData);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });
    expect(result.current.connectionUnavailable).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('triggerPoll triggers an immediate fetch', async () => {
    mockGetTelemetry.mockResolvedValue(mockTelemetryData);

    const { result } = renderHook(() => useTelemetry());

    // Initial fetch
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    const callsAfterMount = mockGetTelemetry.mock.calls.length;

    // triggerPoll fires immediately
    await act(async () => {
      result.current.triggerPoll();
      await vi.runOnlyPendingTimersAsync();
    });
    expect(mockGetTelemetry.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });
});
