/**
 * Feature: iot-dashboard-frontend
 * Property 7: Channel update invokes API with correct parameters
 * Validates: Requirements 6.2
 */
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { CurrentUpdateForm } from '../components/CurrentUpdateForm';

describe('CurrentUpdateForm — Property 7: Channel update invokes API with correct parameters', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSubmit with (channelId, parsedValue) for any valid channel and current', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('A', 'B', 'C'),
        fc.double({ min: 0, max: 999.99, noNaN: true }),
        async (channelId, value) => {
          const onSubmit = vi.fn().mockResolvedValue(undefined);
          const user = userEvent.setup();

          render(
            <CurrentUpdateForm
              channelId={channelId}
              disabled={false}
              onSubmit={onSubmit}
            />
          );

          // Normalize the value the same way the component will parse it
          const parsedValue = parseFloat(String(value));

          // Type the value into the numeric input
          const input = screen.getByRole('spinbutton');
          await user.clear(input);
          await user.type(input, String(parsedValue));

          // Submit the form
          const submitButton = screen.getByRole('button', { name: /submit current update/i });
          await user.click(submitButton);

          // Assert onSubmit was called with (channelId, parsedValue)
          expect(onSubmit).toHaveBeenCalledTimes(1);
          expect(onSubmit).toHaveBeenCalledWith(channelId, parsedValue);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
