// Feature: iot-dashboard-frontend
// Property 4: OverloadPanel lists exactly the overloaded channels
// Validates: Requirements 3.1, 3.2, 3.3

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { OverloadPanel } from '../components/OverloadPanel';
import i18n from '../i18n';

describe('Property 4: OverloadPanel lists exactly the overloaded channels', () => {
  it('renders the correct overload list for any channel array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            channel: fc.constantFrom('A', 'B', 'C'),
            currentAmps: fc.float({ min: 0, max: 30 }),
            overload: fc.boolean(),
            relayActive: fc.boolean(),
            lastOverloadAt: fc.constantFrom(null, '2024-01-15T10:00:00Z'),
          })
        ),
        (channels) => {
          const { unmount } = render(<OverloadPanel channels={channels} />);

          const overloaded = channels.filter((c) => c.overload);

          if (overloaded.length === 0) {
            expect(screen.getByText(i18n.t('overload.allNormal'))).toBeInTheDocument();
          } else {
            // Check count message (uses i18n translation with interpolation)
            const countText = i18n.t('overload.channelsInOverload', { count: overloaded.length });
            expect(screen.getByText(countText)).toBeInTheDocument();

            // Check each overloaded channel identifier is listed
            for (const ch of overloaded) {
              const channelLabel = i18n.t('overload.channelLabel', { id: ch.channel });
              expect(
                screen.getAllByText(channelLabel).length
              ).toBeGreaterThan(0);
            }
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
