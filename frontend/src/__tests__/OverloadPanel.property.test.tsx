// Feature: iot-dashboard-frontend
// Property 4: OverloadPanel lists exactly the overloaded channels
// Validates: Requirements 3.1, 3.2, 3.3

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { OverloadPanel } from '../components/OverloadPanel';

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
          })
        ),
        (channels) => {
          const { unmount } = render(<OverloadPanel channels={channels} />);

          const overloaded = channels.filter((c) => c.overload);

          if (overloaded.length === 0) {
            expect(screen.getByText('All channels normal')).toBeInTheDocument();
          } else {
            // Check count message
            const countText =
              overloaded.length === 1
                ? '1 channel in overload'
                : `${overloaded.length} channels in overload`;
            expect(screen.getByText(countText)).toBeInTheDocument();

            // Check each overloaded channel identifier is listed
            for (const ch of overloaded) {
              expect(
                screen.getAllByText(`Channel ${ch.channel}`).length
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
