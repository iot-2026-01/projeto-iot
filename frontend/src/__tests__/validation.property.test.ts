// Feature: iot-dashboard-frontend
// Property 5: Current value validation rejects out-of-range inputs
// Validates: Requirements 6.3

import * as fc from 'fast-check';
import { isValidCurrent } from '../utils/validation';

describe('Property 5: Current value validation', () => {
  it('accepts any finite number in [0, 999.99]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(999.99), noNaN: true }),
        (value) => {
          expect(isValidCurrent(value)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects negative, >999.99, NaN, and Infinity', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ max: Math.fround(-0.001), noNaN: true, noDefaultInfinity: true }),
          fc.float({ min: 1000, noNaN: true, noDefaultInfinity: true }),
          fc.constant(NaN),
          fc.constant(Infinity)
        ),
        (value) => {
          expect(isValidCurrent(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
