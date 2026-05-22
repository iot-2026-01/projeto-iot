// Feature: iot-dashboard-frontend
// Property 8: HTTP error display includes status code and message
// Property 9: Polling and control-action errors carry distinct labels
// Validates: Requirements 9.1, 9.4

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ErrorBanner } from '../components/ErrorBanner';

describe('Property 8: HTTP error display includes status code and message', () => {
  it('renders both status code and message in the DOM for action errors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1 }),
        (statusCode, message) => {
          const errorMessage = `Error ${statusCode}: ${message}`;
          const { unmount } = render(
            <ErrorBanner message={errorMessage} type="action" />
          );

          const alert = screen.getByRole('alert');
          expect(alert.textContent).toContain(String(statusCode));
          expect(alert.textContent).toContain(message);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 9: Polling and control-action errors carry distinct labels', () => {
  it('polling and action error banners display different prefix text', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (message) => {
          const { unmount: unmount1 } = render(
            <ErrorBanner message={message} type="polling" />
          );
          const pollingAlert = screen.getByRole('alert');
          const pollingText = pollingAlert.textContent ?? '';
          unmount1();

          const { unmount: unmount2 } = render(
            <ErrorBanner message={message} type="action" />
          );
          const actionAlert = screen.getByRole('alert');
          const actionText = actionAlert.textContent ?? '';
          unmount2();

          // The visible text must differ (polling has "Data refresh failed:" prefix)
          expect(pollingText).not.toBe(actionText);
        }
      ),
      { numRuns: 100 }
    );
  });
});
