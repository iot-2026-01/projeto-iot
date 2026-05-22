// Feature: iot-dashboard-frontend
// Unit tests for TelemetryPanel
// Validates: Requirements 4.1, 4.3, 4.6

import { render, screen } from '@testing-library/react';
import { TelemetryPanel } from '../components/TelemetryPanel';
import type { TelemetryData } from '../types';

const mockData: TelemetryData = {
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

describe('TelemetryPanel', () => {
  it('renders device ID and event counter from props', () => {
    render(<TelemetryPanel data={mockData} loading={false} />);

    expect(screen.getByText('esp32-001')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows placeholder state when loading=true and data=null', () => {
    render(<TelemetryPanel data={null} loading={true} />);

    const placeholders = screen.getAllByText('—');
    // All 4 fields (device, uptime, events, timestamp) should show placeholder
    expect(placeholders.length).toBe(4);
  });

  it('updates all fields when new data is passed', () => {
    const { rerender } = render(<TelemetryPanel data={null} loading={true} />);

    // Initially shows placeholders
    expect(screen.getAllByText('—').length).toBe(4);

    // Rerender with data
    rerender(<TelemetryPanel data={mockData} loading={false} />);

    expect(screen.getByText('esp32-001')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('1h 1m 1s')).toBeInTheDocument();
    // Timestamp will be in local timezone, just check it's not a placeholder
    expect(screen.queryAllByText('—').length).toBe(0);
  });
});
