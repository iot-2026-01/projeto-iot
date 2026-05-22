import type { ChannelData, TelemetryData } from '../types';

export interface ApiError {
  type: 'network' | 'timeout' | 'http';
  status?: number;
  message: string;
}

function classifyError(err: unknown): ApiError {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { type: 'timeout', message: 'Request timed out' };
  }
  if (err instanceof TypeError) {
    return { type: 'network', message: err.message || 'Network error' };
  }
  // Re-throw ApiErrors that were already classified (e.g. HTTP errors)
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'message' in err
  ) {
    return err as ApiError;
  }
  return { type: 'network', message: String(err) };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json();
      message = body?.message ?? body?.error ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    const error: ApiError = {
      type: 'http',
      status: response.status,
      message,
    };
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function getTelemetry(signal?: AbortSignal): Promise<TelemetryData> {
  try {
    const response = await fetch('/api/load-balancer/telemetry', { signal });
    const raw = await handleResponse<Omit<TelemetryData, 'timestamp'> & { timestamp: string }>(response);
    return {
      ...raw,
      timestamp: new Date(raw.timestamp),
    };
  } catch (err) {
    throw classifyError(err);
  }
}

export async function getChannels(signal?: AbortSignal): Promise<ChannelData[]> {
  try {
    const response = await fetch('/api/load-balancer/channels', { signal });
    return handleResponse<ChannelData[]>(response);
  } catch (err) {
    throw classifyError(err);
  }
}

export async function setRelay(
  channelId: string,
  state: boolean,
  signal?: AbortSignal
): Promise<ChannelData> {
  try {
    const response = await fetch('/api/load-balancer/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, state }),
      signal,
    });
    return handleResponse<ChannelData>(response);
  } catch (err) {
    throw classifyError(err);
  }
}

export async function updateChannel(
  channelId: string,
  current: number,
  signal?: AbortSignal
): Promise<ChannelData> {
  try {
    const response = await fetch('/api/load-balancer/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, current }),
      signal,
    });
    return handleResponse<ChannelData>(response);
  } catch (err) {
    throw classifyError(err);
  }
}

export async function resetSystem(signal?: AbortSignal): Promise<void> {
  try {
    const response = await fetch('/api/load-balancer/reset', {
      method: 'POST',
      signal,
    });
    if (!response.ok) {
      let message: string;
      try {
        const body = await response.json();
        message = body?.message ?? body?.error ?? response.statusText;
      } catch {
        message = response.statusText;
      }
      const error: ApiError = {
        type: 'http',
        status: response.status,
        message,
      };
      throw error;
    }
  } catch (err) {
    throw classifyError(err);
  }
}
