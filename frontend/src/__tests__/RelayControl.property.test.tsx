// Feature: iot-dashboard-frontend
// Property 6: Relay indicator displays correct state
// Validates: Requirements 5.2

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { RelayControl } from '../components/RelayControl';
import i18n from '../i18n';

describe('Property 6: Relay indicator displays correct state', () => {
  it('shows the correct label and has role="status" for any valid channel and relay state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.boolean(),
        (channelId, relayActive) => {
          const { unmount } = render(
            <RelayControl
              channelId={channelId}
              relayActive={relayActive}
            />
          );

          const indicator = screen.getByRole('status');
          expect(indicator).toBeInTheDocument();

          const expectedLabel = relayActive
            ? i18n.t('relay.connected')
            : i18n.t('relay.disconnected');
          expect(indicator).toHaveTextContent(expectedLabel);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
