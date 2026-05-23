# Implementation Plan: i18n Localization

## Overview

This plan implements internationalization (i18n) for the IoT Dashboard frontend using `react-i18next`. The approach installs dependencies, sets up the i18n infrastructure (configuration + translation files), creates the LanguageSelector component, then migrates all existing components to use the `t()` function. Property-based tests validate correctness properties, and a completeness test ensures translation parity across locales.

## Tasks

- [x] 1. Install dependencies and set up i18n infrastructure
  - [x] 1.1 Install react-i18next and i18next packages
    - Run `npm install i18next react-i18next` in the frontend directory
    - Verify packages are added to `package.json` dependencies
    - _Requirements: 1.1_

  - [x] 1.2 Create i18n types and constants
    - Create `src/i18n/types.ts` with `SupportedLocale` type, `SUPPORTED_LOCALES` array, `LOCALE_LABELS` record, `DEFAULT_LOCALE` constant, and `STORAGE_KEY` constant
    - Follow the interface defined in the design document
    - _Requirements: 1.1, 5.1_

  - [x] 1.3 Create Brazilian Portuguese translation file
    - Create `src/i18n/locales/pt-BR.json` with all translation keys covering: header, telemetry, overload, channel, relay, uptimeFree, reset, confirm, and error namespaces
    - Include interpolation placeholders (e.g., `{{count}}`, `{{id}}`, `{{message}}`, `{{time}}`, `{{channel}}`, `{{state}}`) where dynamic values are needed
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1_

  - [x] 1.4 Create English translation file
    - Create `src/i18n/locales/en.json` with the same key structure as pt-BR.json, translated to English
    - Ensure identical key set to pt-BR.json
    - _Requirements: 3.1, 3.2, 6.1, 6.2_

  - [x] 1.5 Create i18next configuration and initialization
    - Create `src/i18n/index.ts` with i18next initialization using `initReactI18next` plugin
    - Implement `getPersistedLocale()` that reads from localStorage with graceful fallback to `pt-BR`
    - Implement `persistLocale()` that writes to localStorage with try/catch
    - Configure: bundled resources, `fallbackLng: false`, `escapeValue: false`, `parseMissingKeyHandler` returning the key, `returnNull: false`
    - Register `languageChanged` event to persist locale
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 5.1, 5.2, 5.3, 5.4_

  - [x] 1.6 Import i18n initialization in main.tsx
    - Add `import './i18n'` at the top of `src/main.tsx` (before App import) to ensure i18next initializes before rendering
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement LanguageSelector component and integrate into App
  - [x] 2.1 Create LanguageSelector component
    - Create `src/components/LanguageSelector.tsx` with a `<select>` element
    - Use `useTranslation()` hook to access `i18n.language` and `i18n.changeLanguage`
    - Render all `SUPPORTED_LOCALES` as `<option>` elements with native language names from `LOCALE_LABELS`
    - Include `aria-label="Language selector"` for accessibility
    - Style consistently with existing dashboard header
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Integrate LanguageSelector into App header
    - Import and render `<LanguageSelector />` in the App header alongside the title
    - Import `useTranslation` hook in App and replace hardcoded "IoT Dashboard" with `t('header.title')`
    - _Requirements: 4.1, 2.3_

- [x] 3. Checkpoint - Verify i18n infrastructure works
  - Ensure the app builds successfully with `npm run build`, ask the user if questions arise.

- [x] 4. Migrate existing components to use translation function
  - [x] 4.1 Migrate TelemetryPanel component
    - Import `useTranslation` and replace hardcoded strings: "Telemetry", "Device ID", "Uptime", "Events", "Last Updated" with `t()` calls using keys `telemetry.title`, `telemetry.deviceId`, `telemetry.uptime`, `telemetry.events`, `telemetry.lastUpdated`
    - _Requirements: 2.3, 3.2, 6.1_

  - [x] 4.2 Migrate OverloadPanel component
    - Replace "Overload Status", "All channels normal", channel count text, and "Channel X" with `t()` calls
    - Use interpolation for dynamic count: `t('overload.channelsInOverload', { count })` and channel label: `t('overload.channelLabel', { id })`
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 6.1_

  - [x] 4.3 Migrate ChannelCard component
    - Replace "Data unavailable", "Channel X", "OVERLOAD" with `t()` calls
    - Use interpolation for channel title: `t('channel.title', { id: channel.channel })`
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 6.1_

  - [x] 4.4 Migrate ErrorBanner component
    - Replace "Data refresh failed: " prefix with `t('error.dataRefreshFailed', { message })`
    - Replace "Dismiss error" aria-label with `t('error.dismissAriaLabel')`
    - _Requirements: 2.3, 3.2, 6.1_

  - [x] 4.5 Migrate ResetButton component
    - Replace "Reset System", "Resetting…", "Reset timed out. Please try again.", and the confirm message with `t()` calls using keys `reset.button`, `reset.pending`, `reset.timeoutError`, `reset.confirmMessage`
    - _Requirements: 2.3, 3.2, 6.1_

  - [x] 4.6 Migrate RelayControl component
    - Replace "Connected", "Disconnected" text and aria-label with `t()` calls
    - Use interpolation for aria-label: `t('relay.ariaLabel', { channel: channelId, state: relayActive ? t('relay.connected') : t('relay.disconnected') })`
    - _Requirements: 2.3, 3.2, 6.1_

  - [x] 4.7 Migrate OverloadFreeUptime component
    - Replace "Uptime:", "No overloads recorded", and "X without overloads" with `t()` calls
    - Use interpolation: `t('uptimeFree.withoutOverloads', { time: formatTimeSince(lastOverloadAt) })`
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 6.1_

  - [x] 4.8 Migrate ConfirmDialog component
    - Replace "Cancel" and "Confirm" button text with `t('confirm.cancel')` and `t('confirm.confirm')`
    - _Requirements: 2.3, 3.2, 6.1_

- [x] 5. Checkpoint - Verify all components render correctly
  - Ensure `npm run build` passes and all components use `t()` for user-facing text, ask the user if questions arise.

- [x] 6. Write tests for i18n infrastructure and components
  - [x] 6.1 Write property test: Translation key lookup returns correct value
    - **Property 1: Translation key lookup returns correct value**
    - Create `src/__tests__/i18n.property.test.ts`
    - Generate random valid keys from the translation file and verify `t(key)` returns the expected value
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 1.3, 1.7**

  - [x] 6.2 Write property test: Missing key fallback returns key itself
    - **Property 2: Missing key fallback returns key itself**
    - Generate random strings not present in the translation file and verify `t(key)` returns the key unchanged
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 1.4, 6.4**

  - [] 6.3 Write property test: Interpolation preserves dynamic values
    - **Property 3: Interpolation preserves dynamic values**
    - For keys with placeholders, generate random parameter values and verify they appear verbatim in the output
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 1.6, 2.4, 3.3**

  - [] 6.4 Write property test: Translation completeness per locale
    - **Property 4: Translation completeness per locale**
    - Verify that every key referenced by components exists in each locale's translation file with a non-empty value
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 2.2, 3.1, 6.1**

  - [] 6.5 Write property test: Translation key parity across locales
    - **Property 5: Translation key parity across locales**
    - Verify that pt-BR.json and en.json have identical key sets
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 6.2**

  - [] 6.6 Write property test: Locale selection updates active locale
    - **Property 6: Locale selection updates active locale**
    - For any supported locale, verify `changeLanguage(locale)` sets the active language correctly
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 4.4**

  - [] 6.7 Write property test: Locale persistence round-trip
    - **Property 7: Locale persistence round-trip**
    - For any supported locale, verify that persisting and re-reading from localStorage returns the same locale
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 5.1, 5.2**

  - [] 6.8 Write property test: Invalid persisted locale falls back to default
    - **Property 8: Invalid persisted locale falls back to default**
    - For any string not in SUPPORTED_LOCALES stored in localStorage, verify `getPersistedLocale()` returns `pt-BR`
    - Use `fast-check` with minimum 100 iterations
    - **Validates: Requirements 5.3**

  - [x] 6.9 Write unit tests for LanguageSelector component
    - Create `src/__tests__/LanguageSelector.test.tsx`
    - Test: renders all locale options with native names
    - Test: shows current active locale as selected
    - Test: switching locale updates displayed text
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 6.10 Write translation completeness build-time test
    - Create `src/__tests__/i18n-completeness.test.ts`
    - Import both JSON files, flatten keys, verify identical key sets
    - Verify no empty string values in either file
    - _Requirements: 6.2, 6.3_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass with `npx vitest --run`, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already uses `fast-check` and `vitest` — no additional test framework setup needed
- Translation files are bundled statically (no async loading) since only two locales with modest volume

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 3, "tasks": ["1.6", "2.1"] },
    { "id": 4, "tasks": ["2.2"] },
    { "id": 5, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10"] }
  ]
}
```
