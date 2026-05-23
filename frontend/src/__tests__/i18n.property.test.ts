// Feature: i18n-localization
// Property-based tests for i18n correctness properties
// **Validates: Requirements 1.3, 1.4, 1.6, 1.7, 2.2, 2.4, 3.1, 3.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.4**

import * as fc from 'fast-check';
import i18n from '../i18n';
import { getPersistedLocale } from '../i18n';
import ptBR from '../i18n/locales/pt-BR.json';
import en from '../i18n/locales/en.json';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, STORAGE_KEY } from '../i18n/types';
import type { SupportedLocale } from '../i18n/types';

/**
 * Recursively flattens a nested JSON object into dot-notation keys
 * with their leaf string values.
 */
function flattenKeys(
  obj: Record<string, unknown>,
  prefix = ''
): { key: string; value: string }[] {
  const entries: { key: string; value: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      entries.push(...flattenKeys(v as Record<string, unknown>, fullKey));
    } else if (typeof v === 'string') {
      entries.push({ key: fullKey, value: v });
    }
  }
  return entries;
}

const translationFiles: Record<SupportedLocale, Record<string, unknown>> = {
  'pt-BR': ptBR as unknown as Record<string, unknown>,
  'en': en as unknown as Record<string, unknown>,
};

describe('Feature: i18n-localization, Property 1: Translation key lookup returns correct value', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const allEntries = flattenKeys(translationFiles[locale]);
    // Filter to only keys without interpolation placeholders for a clean lookup test
    const leafEntries = allEntries.filter(
      (entry) => !entry.value.includes('{{')
    );

    it(`for locale "${locale}", t(key) returns the correct value from the translation file`, () => {
      i18n.changeLanguage(locale);
      const keyArbitrary = fc.constantFrom(...leafEntries);
      fc.assert(
        fc.property(keyArbitrary, ({ key, value }) => {
          const result = i18n.t(key);
          expect(result).toBe(value);
        }),
        { numRuns: 100 }
      );
    });
  }

  it('supports dot-notation keys for nested translation values', () => {
    i18n.changeLanguage('pt-BR');
    const allEntries = flattenKeys(translationFiles['pt-BR']);
    const nestedEntries = allEntries.filter(
      (entry) => entry.key.includes('.') && !entry.value.includes('{{')
    );
    const keyArbitrary = fc.constantFrom(...nestedEntries);
    fc.assert(
      fc.property(keyArbitrary, ({ key, value }) => {
        const result = i18n.t(key);
        expect(result).toBe(value);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 5: Translation key parity across locales
// Validates: Requirements 6.2
// ============================================================

/**
 * Recursively flattens a nested object into dot-notation key strings.
 */
function flattenKeyStrings(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeyStrings(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const ptBRKeys = flattenKeyStrings(ptBR as Record<string, unknown>).sort();
const enKeys = flattenKeyStrings(en as Record<string, unknown>).sort();
const ptBRKeySet = new Set(ptBRKeys);
const enKeySet = new Set(enKeys);

describe('Feature: i18n-localization, Property 5: Translation key parity across locales', () => {
  /**
   * **Validates: Requirements 6.2**
   *
   * For any key present in any supported locale's translation file,
   * that same key shall be present in all other supported locale
   * translation files — the key sets across all locale files shall be identical.
   */
  it('every key in pt-BR.json exists in en.json', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ptBRKeys),
        (key) => {
          expect(enKeySet.has(key)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('every key in en.json exists in pt-BR.json', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...enKeys),
        (key) => {
          expect(ptBRKeySet.has(key)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('both locale files have the same total number of keys', () => {
    expect(ptBRKeys.length).toBe(enKeys.length);
  });

  it('the sorted key arrays are identical', () => {
    expect(ptBRKeys).toEqual(enKeys);
  });
});


// ============================================================
// Property 2: Missing key fallback returns key itself
// Validates: Requirements 1.4, 6.4
// ============================================================

describe('Feature: i18n-localization, Property 2: Missing key fallback returns key itself', () => {
  /**
   * **Validates: Requirements 1.4, 6.4**
   *
   * For any arbitrary string that is not present as a key in the active
   * locale's translation file, calling the translation function with that
   * string shall return the string itself unchanged.
   *
   * Note: We exclude strings containing ':' (i18next namespace separator)
   * since i18next splits on ':' for namespace resolution, which is expected
   * framework behavior and not a missing-key scenario.
   */
  const allKeys = new Set(flattenKeyStrings(ptBR as Record<string, unknown>));

  // Generate keys that are valid i18next key strings (no namespace separator ':')
  const missingKeyArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !s.includes(':') && !allKeys.has(s));

  it('t(key) returns the key itself when the key is not in the translation file', () => {
    i18n.changeLanguage('pt-BR');
    fc.assert(
      fc.property(missingKeyArb, (randomKey) => {
        const result = i18n.t(randomKey);
        expect(result).toBe(randomKey);
      }),
      { numRuns: 100 }
    );
  });

  it('works for en locale as well', () => {
    i18n.changeLanguage('en');
    const enAllKeys = new Set(flattenKeyStrings(en as Record<string, unknown>));
    const enMissingKeyArb = fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => !s.includes(':') && !enAllKeys.has(s));
    fc.assert(
      fc.property(enMissingKeyArb, (randomKey) => {
        const result = i18n.t(randomKey);
        expect(result).toBe(randomKey);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 3: Interpolation preserves dynamic values
// Validates: Requirements 1.6, 2.4, 3.3
// ============================================================

describe('Feature: i18n-localization, Property 3: Interpolation preserves dynamic values', () => {
  /**
   * **Validates: Requirements 1.6, 2.4, 3.3**
   *
   * For any translation key whose value contains placeholder tokens,
   * and for any parameter values provided, the translation function shall
   * produce an output string where each placeholder is replaced by its
   * corresponding parameter value, with the parameter value appearing verbatim.
   */

  // Extract keys with interpolation placeholders and their placeholder names
  function getInterpolationEntries(obj: Record<string, unknown>) {
    const entries = flattenKeys(obj);
    return entries
      .filter((entry) => entry.value.includes('{{'))
      .map((entry) => {
        const placeholders = [...entry.value.matchAll(/\{\{(\w+)\}\}/g)].map(
          (m) => m[1]
        );
        return { key: entry.key, value: entry.value, placeholders };
      });
  }

  for (const locale of SUPPORTED_LOCALES) {
    const interpolationEntries = getInterpolationEntries(
      translationFiles[locale]
    );

    it(`for locale "${locale}", interpolated values appear verbatim in the output`, () => {
      i18n.changeLanguage(locale);
      const entryArb = fc.constantFrom(...interpolationEntries);
      const valueArb = fc.string({ minLength: 1, maxLength: 30 }).filter(
        (s) => !s.includes('{{') && !s.includes('}}')
      );

      fc.assert(
        fc.property(entryArb, valueArb, (entry, paramValue) => {
          const params: Record<string, string> = {};
          for (const placeholder of entry.placeholders) {
            params[placeholder] = paramValue;
          }
          const result = i18n.t(entry.key, params);
          // Each placeholder should be replaced with the param value
          expect(result).toContain(paramValue);
          // No remaining placeholder tokens
          expect(result).not.toContain('{{');
          expect(result).not.toContain('}}');
        }),
        { numRuns: 100 }
      );
    });
  }
});

// ============================================================
// Property 4: Translation completeness per locale
// Validates: Requirements 2.2, 3.1, 6.1
// ============================================================

describe('Feature: i18n-localization, Property 4: Translation completeness per locale', () => {
  /**
   * **Validates: Requirements 2.2, 3.1, 6.1**
   *
   * For any supported locale and for any translation key referenced by
   * dashboard components, the locale's translation file shall contain a
   * non-empty string value for that key.
   */

  // Use the union of all keys from both locale files as the reference set
  const allReferenceKeys = [
    ...new Set([...ptBRKeys, ...enKeys]),
  ];

  for (const locale of SUPPORTED_LOCALES) {
    const localeEntries = flattenKeys(translationFiles[locale]);
    const localeMap = new Map(localeEntries.map((e) => [e.key, e.value]));

    it(`locale "${locale}" has a non-empty value for every referenced key`, () => {
      fc.assert(
        fc.property(fc.constantFrom(...allReferenceKeys), (key) => {
          const value = localeMap.get(key);
          expect(value).toBeDefined();
          expect(value!.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  }
});

// ============================================================
// Property 6: Locale selection updates active locale
// Validates: Requirements 4.4
// ============================================================

describe('Feature: i18n-localization, Property 6: Locale selection updates active locale', () => {
  /**
   * **Validates: Requirements 4.4**
   *
   * For any supported locale, when that locale is selected via
   * changeLanguage, the i18next instance's active language shall equal
   * the selected locale.
   */
  it('changeLanguage(locale) sets the active language correctly', async () => {
    fc.assert(
      fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale) => {
        i18n.changeLanguage(locale);
        expect(i18n.language).toBe(locale);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 7: Locale persistence round-trip
// Validates: Requirements 5.1, 5.2
// ============================================================

describe('Feature: i18n-localization, Property 7: Locale persistence round-trip', () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any supported locale, after selecting it (triggering persistence
   * to localStorage), re-initializing the locale resolution function shall
   * return that same locale as the active locale.
   */
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persisting and re-reading from localStorage returns the same locale', () => {
    fc.assert(
      fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale) => {
        // Simulate what happens when changeLanguage is called:
        // the languageChanged event persists to localStorage
        localStorage.setItem(STORAGE_KEY, locale);
        const retrieved = getPersistedLocale();
        expect(retrieved).toBe(locale);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 8: Invalid persisted locale falls back to default
// Validates: Requirements 5.3
// ============================================================

describe('Feature: i18n-localization, Property 8: Invalid persisted locale falls back to default', () => {
  /**
   * **Validates: Requirements 5.3**
   *
   * For any string that is not a member of the supported locales set,
   * if that string is stored in localStorage as the persisted locale,
   * the locale resolution function shall return pt-BR as the active locale.
   */
  const supportedSet = new Set<string>(SUPPORTED_LOCALES);

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getPersistedLocale() returns pt-BR for any invalid locale string in localStorage', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !supportedSet.has(s)
        ),
        (invalidLocale) => {
          localStorage.setItem(STORAGE_KEY, invalidLocale);
          const result = getPersistedLocale();
          expect(result).toBe(DEFAULT_LOCALE);
        }
      ),
      { numRuns: 100 }
    );
  });
});
