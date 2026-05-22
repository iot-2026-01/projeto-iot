/**
 * Formats a Date object as "YYYY-MM-DD HH:MM:SS" in the user's local timezone,
 * with all components zero-padded to their expected widths.
 *
 * @param date - The Date to format
 * @returns A string in the format "YYYY-MM-DD HH:MM:SS"
 *
 * @example
 * formatTimestamp(new Date('2024-01-15T09:05:03')) // "2024-01-15 09:05:03"
 */
export function formatTimestamp(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
