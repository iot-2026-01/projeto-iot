/**
 * Returns true iff value is a finite number in [0, 999.99].
 * Requirements: 6.3
 */
export function isValidCurrent(value: unknown): boolean {
  return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 999.99;
}

/**
 * Returns true iff id is "A", "B", or "C".
 * Requirements: 6.3
 */
export function isValidChannelId(id: unknown): boolean {
  return id === 'A' || id === 'B' || id === 'C';
}
