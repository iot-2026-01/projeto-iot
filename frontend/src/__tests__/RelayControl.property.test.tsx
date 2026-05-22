// Feature: iot-dashboard-frontend
// Property 6: Relay control invokes API with correct parameters
// Validates: Requirements 5.2

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { RelayControl } from '../components/RelayControl';

describe('Property 6: Relay control invokes API with correct parameters', () => {
  it('calls onToggle with (channelId, !relayActive) for any valid channel and relay state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('A', 'B', 'C'),
        fc.boolean(),
        async (channelId, relayActive) => {
          const onToggle = vi.fn().mockResolvedValue(undefined);

          const { unmount } = render(
            <RelayControl
              channelId={channelId}
              relayActive={relayActive}
              disabled={false}
              onToggle={onToggle}
            />
          );

          const button = screen.getByRole('button');
          await userEvent.click(button);

          expect(onToggle).toHaveBeenCalledTimes(1);
          expect(onToggle).toHaveBeenCalledWith(channelId, !relayActive);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
