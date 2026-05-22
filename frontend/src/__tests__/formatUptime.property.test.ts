// Feature: iot-dashboard-frontend
// Property 1: formatUptime correctness
// Validates: Requirements 4.2

import * as fc from 'fast-check';
import { formatUptime } from '../utils/formatUptime';

describe('Property 1: formatUptime correctness', () => {
  it('returns correct Xh Ym Zs for any non-negative seconds', () => {
    fc.assert(
      fc.property(fc.nat(), (seconds) => {
        const result = formatUptime(seconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        expect(result).toBe(`${h}h ${m}m ${s}s`);
      }),
      { numRuns: 100 }
    );
  });
});
