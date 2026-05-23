// Build-time validation test for translation completeness
// Validates: Requirements 6.2, 6.3

import { describe, it, expect } from 'vitest';
import ptBR from '../i18n/locales/pt-BR.json';
import en from '../i18n/locales/en.json';

/**
 * Recursively flattens a nested JSON object into dot-notation keys.
 * e.g., { header: { title: "X" } } → ["header.title"]
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/**
 * Recursively collects all leaf string values from a nested JSON object.
 * Returns entries as [dotKey, value] pairs.
 */
function flattenEntries(obj: Record<string, unknown>, prefix = ''): [string, string][] {
  const entries: [string, string][] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      entries.push(...flattenEntries(value as Record<string, unknown>, fullKey));
    } else if (typeof value === 'string') {
      entries.push([fullKey, value]);
    }
  }
  return entries;
}

describe('Translation completeness (build-time validation)', () => {
  const ptBRKeys = flattenKeys(ptBR as Record<string, unknown>).sort();
  const enKeys = flattenKeys(en as Record<string, unknown>).sort();

  it('pt-BR and en translation files have identical key sets', () => {
    const missingInEn = ptBRKeys.filter((key) => !enKeys.includes(key));
    const missingInPtBR = enKeys.filter((key) => !ptBRKeys.includes(key));

    expect(missingInEn, `Keys in pt-BR but missing in en: ${missingInEn.join(', ')}`).toEqual([]);
    expect(missingInPtBR, `Keys in en but missing in pt-BR: ${missingInPtBR.join(', ')}`).toEqual([]);
  });

  it('pt-BR translation file has no empty string values', () => {
    const ptBREntries = flattenEntries(ptBR as Record<string, unknown>);
    const emptyKeys = ptBREntries
      .filter(([, value]) => value === '')
      .map(([key]) => key);

    expect(emptyKeys, `Empty values in pt-BR: ${emptyKeys.join(', ')}`).toEqual([]);
  });

  it('en translation file has no empty string values', () => {
    const enEntries = flattenEntries(en as Record<string, unknown>);
    const emptyKeys = enEntries
      .filter(([, value]) => value === '')
      .map(([key]) => key);

    expect(emptyKeys, `Empty values in en: ${emptyKeys.join(', ')}`).toEqual([]);
  });
});
