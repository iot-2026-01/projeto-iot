// Feature: iot-dashboard-frontend
// Unit tests for OverloadPanel
// Validates: Requirements 3.2, 3.3

import { render, screen } from '@testing-library/react';
import { OverloadPanel } from '../components/OverloadPanel';
import i18n from '../i18n';
import { beforeEach } from 'vitest';

describe('OverloadPanel', () => {
  beforeEach(() => {
    i18n.changeLanguage('pt-BR');
  });

  it('renders all-normal message when all overload fields are false', () => {
    const channels = [
      { channel: 'A', currentAmps: 5.0, overload: false, relayActive: true, lastOverloadAt: null },
      { channel: 'B', currentAmps: 8.0, overload: false, relayActive: true, lastOverloadAt: null },
      { channel: 'C', currentAmps: 3.0, overload: false, relayActive: true, lastOverloadAt: null },
    ];

    render(<OverloadPanel channels={channels} />);

    expect(screen.getByText('Todos os canais normais')).toBeInTheDocument();
  });

  it('lists correct channel identifiers when some channels are overloaded', () => {
    const channels = [
      { channel: 'A', currentAmps: 16.0, overload: true, relayActive: false, lastOverloadAt: '2024-01-15T10:00:00Z' },
      { channel: 'B', currentAmps: 8.0, overload: false, relayActive: true, lastOverloadAt: null },
      { channel: 'C', currentAmps: 17.5, overload: true, relayActive: false, lastOverloadAt: '2024-01-15T10:05:00Z' },
    ];

    render(<OverloadPanel channels={channels} />);

    expect(screen.getByText('2 canal(is) em sobrecarga')).toBeInTheDocument();
    expect(screen.getByText('Canal A')).toBeInTheDocument();
    expect(screen.getByText('Canal C')).toBeInTheDocument();
    expect(screen.queryByText('Canal B')).not.toBeInTheDocument();
  });
});
