// Feature: iot-dashboard-frontend
// Unit tests for OverloadPanel
// Validates: Requirements 3.2, 3.3

import { render, screen } from '@testing-library/react';
import { OverloadPanel } from '../components/OverloadPanel';

describe('OverloadPanel', () => {
  it('renders "All channels normal" when all overload fields are false', () => {
    const channels = [
      { channel: 'A', currentAmps: 5.0, overload: false, relayActive: true },
      { channel: 'B', currentAmps: 8.0, overload: false, relayActive: true },
      { channel: 'C', currentAmps: 3.0, overload: false, relayActive: true },
    ];

    render(<OverloadPanel channels={channels} />);

    expect(screen.getByText('All channels normal')).toBeInTheDocument();
  });

  it('lists correct channel identifiers when some channels are overloaded', () => {
    const channels = [
      { channel: 'A', currentAmps: 16.0, overload: true, relayActive: false },
      { channel: 'B', currentAmps: 8.0, overload: false, relayActive: true },
      { channel: 'C', currentAmps: 17.5, overload: true, relayActive: false },
    ];

    render(<OverloadPanel channels={channels} />);

    expect(screen.getByText('2 channels in overload')).toBeInTheDocument();
    expect(screen.getByText('Channel A')).toBeInTheDocument();
    expect(screen.getByText('Channel C')).toBeInTheDocument();
    expect(screen.queryByText('Channel B')).not.toBeInTheDocument();
  });
});
