// Feature: iot-dashboard-frontend
// Property 3: ChannelCard renders all fields correctly
// Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ChannelCard } from '../components/ChannelCard';

describe('Property 3: ChannelCard renders all fields correctly', () => {
  it('displays channel identifier, formatted current, correct data-overload attribute, and relay label for any ChannelData', () => {
    fc.assert(
      fc.property(
        fc.record({
          channel: fc.constantFrom('A', 'B', 'C'),
          currentAmps: fc.float({ min: 0, max: 30 }),
          overload: fc.boolean(),
          relayActive: fc.boolean(),
        }),
        (channelData) => {
          const onRelayChange = vi.fn().mockResolvedValue(undefined);
          const onCurrentUpdate = vi.fn().mockResolvedValue(undefined);

          const { container, unmount } = render(
            <ChannelCard
              channel={channelData}
              disabled={false}
              onRelayChange={onRelayChange}
              onCurrentUpdate={onCurrentUpdate}
            />
          );

          // Requirement 2.1: channel identifier is visible
          expect(
            screen.getByText(`Channel ${channelData.channel}`)
          ).toBeInTheDocument();

          // Requirement 2.2: current formatted to 2 decimal places + "A"
          const expectedCurrent = `${channelData.currentAmps.toFixed(2)}A`;
          expect(screen.getByText(expectedCurrent)).toBeInTheDocument();

          // Requirement 2.3: data-overload attribute matches overload field
          const cardRoot = container.firstElementChild as HTMLElement;
          expect(cardRoot.getAttribute('data-overload')).toBe(
            channelData.overload ? 'true' : 'false'
          );

          // Requirements 2.4, 2.5: relay label matches relayActive
          const expectedRelayLabel = channelData.relayActive
            ? 'Connected'
            : 'Disconnected';
          expect(screen.getByText(expectedRelayLabel)).toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
