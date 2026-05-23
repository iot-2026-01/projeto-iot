import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChannelCard } from '../components/ChannelCard';
import type { ChannelData } from '../types';

const baseChannel: ChannelData = {
  channel: 'A',
  currentAmps: 5.0,
  overload: false,
  relayActive: true,
  lastOverloadAt: null,
};

// ─── Null channel ─────────────────────────────────────────────────────────────

describe('ChannelCard — null channel', () => {
  it('renders "Dados indisponíveis" when channel is null', () => {
    render(<ChannelCard channel={null} />);

    expect(screen.getByText('Dados indisponíveis')).toBeInTheDocument();
  });
});

// ─── Relay label ──────────────────────────────────────────────────────────────

describe('ChannelCard — relay label', () => {
  it('shows "Conectado" when relayActive is true', () => {
    render(<ChannelCard channel={{ ...baseChannel, relayActive: true }} />);

    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('shows "Desconectado" when relayActive is false', () => {
    render(<ChannelCard channel={{ ...baseChannel, relayActive: false }} />);

    expect(screen.getByText('Desconectado')).toBeInTheDocument();
  });
});

// ─── Overload-free uptime ─────────────────────────────────────────────────────

describe('ChannelCard — overload-free uptime', () => {
  it('shows "Nenhuma sobrecarga registrada" when lastOverloadAt is null', () => {
    render(<ChannelCard channel={{ ...baseChannel, lastOverloadAt: null }} />);

    expect(screen.getByText('Nenhuma sobrecarga registrada')).toBeInTheDocument();
  });

  it('shows time since last overload when lastOverloadAt is set', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<ChannelCard channel={{ ...baseChannel, lastOverloadAt: fiveMinutesAgo }} />);

    // Should show something like "5m 0s sem sobrecargas"
    expect(screen.getByText(/sem sobrecargas/)).toBeInTheDocument();
  });
});
