/**
 * Returns true iff value is a finite number in [0, 999.99].
 * Requirements: 6.3
 */
export function isValidCurrent(value: unknown): boolean {
  return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 999.99;
}


