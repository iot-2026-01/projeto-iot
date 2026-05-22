// Feature: iot-dashboard-frontend
// Property 2: formatTimestamp format correctness
// Validates: Requirements 4.4

import * as fc from 'fast-check';
import { formatTimestamp } from '../utils/formatTimestamp';

describe('Property 2: formatTimestamp format correctness', () => {
  it('returns a string matching YYYY-MM-DD HH:MM:SS for any Date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1000-01-02T00:00:00Z'), max: new Date('9998-12-31T23:59:59Z') }),
        (date) => {
          const result = formatTimestamp(date);
          expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });
});
