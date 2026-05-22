import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChannelCard } from '../components/ChannelCard';
import type { ChannelData } from '../types';

const baseChannel: ChannelData = {
  channel: 'A',
  currentAmps: 5.0,
  overload: false,
  relayActive: true,
};

// ─── Null channel ─────────────────────────────────────────────────────────────

describe('ChannelCard — null channel', () => {
  it('renders "Data unavailable" when channel is null', () => {
    render(
      <ChannelCard
        channel={null}
        disabled={false}
        onRelayChange={vi.fn()}
        onCurrentUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Data unavailable')).toBeInTheDocument();
  });
});

// ─── Relay label ──────────────────────────────────────────────────────────────

describe('ChannelCard — relay label', () => {
  it('shows "Connected" when relayActive is true', () => {
    render(
      <ChannelCard
        channel={{ ...baseChannel, relayActive: true }}
        disabled={false}
        onRelayChange={vi.fn()}
        onCurrentUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows "Disconnected" when relayActive is false', () => {
    render(
      <ChannelCard
        channel={{ ...baseChannel, relayActive: false }}
        disabled={false}
        onRelayChange={vi.fn()}
        onCurrentUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});
