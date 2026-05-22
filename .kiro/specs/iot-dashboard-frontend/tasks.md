# Implementation Plan: IoT Dashboard Frontend

## Overview

Scaffold a Vite + React 18 + TypeScript 5 SPA in `/frontend`, wire it to the existing Express API via a dev proxy, and implement real-time monitoring and manual control of the Smart Load Balancing System. The UI follows the Binance-inspired dark design system defined in `/DESIGN.md`.

## Tasks

- [x] 1. Scaffold the Vite project and configure tooling
  - Run `npm create vite@latest frontend -- --template react-ts` from the project root to generate the base project
  - Install runtime dependencies: `react`, `react-dom` (already included by template)
  - Install dev dependencies: `tailwindcss@3`, `postcss`, `autoprefixer`, `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `fast-check`
  - Run `npx tailwindcss init -p` to generate `tailwind.config.ts` and `postcss.config.js`
  - Configure `tailwind.config.ts` with Binance token extensions (colors, fontFamily, borderRadius) as specified in the design document
  - Add `@import 'tailwindcss/base'`, `@import 'tailwindcss/components'`, `@import 'tailwindcss/utilities'` to `src/index.css`
  - Configure `vite.config.ts`: add `server.proxy['/api'] → http://localhost:3000` and set up Vitest with `jsdom` environment and `@testing-library/jest-dom` setup file
  - Add Google Fonts import for Inter and IBM Plex Mono in `index.html`
  - Delete Vite boilerplate files (`App.css`, `assets/react.svg`, default `App.tsx` content)
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Define shared types and utility functions
  - [x] 2.1 Create `src/types/index.ts` with `ChannelData` and `TelemetryData` interfaces mirroring the API types exactly
    - `ChannelData`: `{ channel: string; currentAmps: number; overload: boolean; relayActive: boolean }`
    - `TelemetryData`: `{ device: string; uptime: number; events: number; channels: ChannelData[]; timestamp: Date }`
    - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4_

  - [x] 2.2 Create `src/utils/formatUptime.ts`
    - Implement `formatUptime(seconds: number): string` returning `"Xh Ym Zs"` where `X = Math.floor(s / 3600)`, `Y = Math.floor((s % 3600) / 60)`, `Z = s % 60`
    - `formatUptime(0)` must return `"0h 0m 0s"`
    - _Requirements: 4.2_

  - [x] 2.3 Write property test for `formatUptime`
    - **Property 1: `formatUptime` correctness**
    - **Validates: Requirements 4.2**
    - File: `src/__tests__/formatUptime.property.test.ts`
    - Use `fc.nat()` to generate non-negative integers; assert `X`, `Y`, `Z` components match the floor formulas; set `{ numRuns: 100 }`

  - [x] 2.4 Create `src/utils/formatTimestamp.ts`
    - Implement `formatTimestamp(date: Date): string` returning `"YYYY-MM-DD HH:MM:SS"` in the user's local timezone, zero-padded
    - _Requirements: 4.4_

  - [x] 2.5 Write property test for `formatTimestamp`
    - **Property 2: `formatTimestamp` format correctness**
    - **Validates: Requirements 4.4**
    - File: `src/__tests__/formatTimestamp.property.test.ts`
    - Use `fc.date()` to generate arbitrary `Date` objects; assert the result matches `/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/`; set `{ numRuns: 100 }`

  - [x] 2.6 Create `src/utils/validation.ts`
    - Implement `isValidCurrent(value: unknown): boolean` — returns `true` iff value is a finite number in `[0, 999.99]`
    - Implement `isValidChannelId(id: unknown): boolean` — returns `true` iff id is `"A"`, `"B"`, or `"C"`
    - _Requirements: 6.3_

  - [x] 2.7 Write property test for current value validation
    - **Property 5: Current value validation rejects out-of-range inputs**
    - **Validates: Requirements 6.3**
    - File: `src/__tests__/validation.property.test.ts`
    - Use `fc.float({ min: 0, max: 999.99 })` for valid range; use `fc.oneof(fc.float({ max: -0.001 }), fc.float({ min: 1000 }), fc.constant(NaN), fc.constant(Infinity))` for invalid; assert `isValidCurrent` returns `true`/`false` accordingly; set `{ numRuns: 100 }`

- [x] 3. Implement the API client module
  - [x] 3.1 Create `src/api/loadBalancer.ts` with typed `ApiError` and all five API functions
    - Export `interface ApiError { type: 'network' | 'timeout' | 'http'; status?: number; message: string }`
    - Implement `getTelemetry(signal?)`, `getChannels(signal?)`, `setRelay(channelId, state, signal?)`, `updateChannel(channelId, current, signal?)`, `resetSystem(signal?)`
    - Each function must parse the JSON response and throw `ApiError` on failure
    - Error classification: `response.ok === false` → `type: 'http'`; `AbortError` → `type: 'timeout'`; `TypeError` → `type: 'network'`
    - Parse `timestamp` field as `new Date(raw.timestamp)` in `getTelemetry` to convert ISO string to `Date`
    - _Requirements: 1.3, 5.2, 6.2, 7.1, 9.1, 9.2_

- [x] 4. Implement the `useTelemetry` hook
  - [x] 4.1 Create `src/hooks/useTelemetry.ts`
    - Return `{ data: TelemetryData | null, loading: boolean, error: ApiError | null, connectionUnavailable: boolean, triggerPoll: () => void }`
    - Use `setInterval` at 2 000 ms, cleared on unmount via `useEffect` cleanup
    - Wrap each fetch in `AbortController` with a 5-second timeout
    - Track consecutive failures: after 3 consecutive failures set `connectionUnavailable = true`; clear on next success
    - `triggerPoll` resets the interval and fires an immediate fetch
    - On success after failure: clear `error` and `connectionUnavailable`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3, 9.5_

  - [x] 4.2 Write unit tests for `useTelemetry`
    - File: `src/__tests__/useTelemetry.test.ts`
    - Test: polling starts on mount and stops on unmount (use `vi.useFakeTimers()`)
    - Test: `connectionUnavailable` becomes `true` after 3 consecutive failures
    - Test: `connectionUnavailable` clears on next success
    - Test: `triggerPoll` triggers an immediate fetch
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement display components
  - [x] 5.1 Create `src/components/ErrorBanner.tsx`
    - Props: `{ message: string | null; type: 'polling' | 'action'; onDismiss?: () => void }`
    - Render nothing when `message` is `null`
    - Prefix polling errors with `"Data refresh failed:"` and action errors with a component-specific prefix passed via `message`
    - Style: `surface-elevated` background, `trading-down` left border (4px), dismissible via `onDismiss` button
    - _Requirements: 9.1, 9.4_

  - [x] 5.2 Write property tests for `ErrorBanner`
    - **Property 8: HTTP error display includes status code and message**
    - **Property 9: Polling and control-action errors carry distinct labels**
    - **Validates: Requirements 9.1, 9.4**
    - File: `src/__tests__/ErrorBanner.property.test.tsx`
    - Property 8: use `fc.integer({ min: 400, max: 599 })` and `fc.string()` for message; render `ErrorBanner` with `type="action"` and assert both status code and message appear in the DOM; set `{ numRuns: 100 }`
    - Property 9: render two `ErrorBanner` instances (one `type="polling"`, one `type="action"`); assert their visible label/prefix text differs; set `{ numRuns: 100 }`

  - [x] 5.3 Create `src/components/TelemetryPanel.tsx`
    - Props: `{ data: TelemetryData | null; loading: boolean }`
    - Display device ID, formatted uptime (`formatUptime`), event counter, formatted timestamp (`formatTimestamp`)
    - Show loading/placeholder state (e.g., `"—"`) for all fields before first successful poll (`loading === true && data === null`)
    - Style: `surface-card` background, `rounded-xl`, 24px padding, `title-sm` section heading
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.4 Write unit tests for `TelemetryPanel`
    - File: `src/__tests__/TelemetryPanel.test.tsx`
    - Test: renders device ID and event counter from props
    - Test: shows placeholder state when `loading=true` and `data=null`
    - Test: updates all fields when new data is passed
    - _Requirements: 4.1, 4.3, 4.6_

  - [x] 5.5 Create `src/components/OverloadPanel.tsx`
    - Props: `{ channels: ChannelData[] }`
    - Derive overloaded channels via `channels.filter(c => c.overload)`
    - Display `"All channels normal"` when no channel is overloaded
    - Display `"N channels in overload"` and list each overloaded channel identifier when one or more are overloaded
    - Style: `surface-card` background, `rounded-xl`, 24px padding; overloaded channel identifiers in `trading-down`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.6 Write property test for `OverloadPanel`
    - **Property 4: OverloadPanel lists exactly the overloaded channels**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - File: `src/__tests__/OverloadPanel.property.test.tsx`
    - Use `fc.array(fc.record({ channel: fc.constantFrom('A','B','C'), currentAmps: fc.float({ min: 0, max: 30 }), overload: fc.boolean(), relayActive: fc.boolean() }))` to generate channel arrays; assert the rendered output matches the filtered overload list exactly; set `{ numRuns: 100 }`

  - [x] 5.7 Write unit tests for `OverloadPanel`
    - File: `src/__tests__/OverloadPanel.test.tsx`
    - Test: renders `"All channels normal"` when all `overload` fields are `false`
    - Test: lists correct channel identifiers when some channels are overloaded
    - _Requirements: 3.2, 3.3_

- [x] 6. Implement control components
  - [x] 6.1 Create `src/components/RelayControl.tsx`
    - Props: `{ channelId: string; relayActive: boolean; disabled: boolean; onToggle: (channelId: string, newState: boolean) => Promise<void> }`
    - Manage internal `pending` boolean; disable button while request is in-flight
    - Button label: `"Connected"` when `relayActive === true` (green `button-trading-up` style), `"Disconnected"` when `false` (dark `button-secondary-on-dark` style)
    - Re-enable button when request completes (success or error)
    - Minimum tap target: 44×44 px
    - _Requirements: 5.1, 5.5, 5.6, 8.4_

  - [x] 6.2 Write property test for `RelayControl`
    - **Property 6: Relay control invokes API with correct parameters**
    - **Validates: Requirements 5.2**
    - File: `src/__tests__/RelayControl.property.test.tsx`
    - Use `fc.constantFrom('A','B','C')` and `fc.boolean()` to generate `channelId` and `relayActive`; mock `onToggle`; simulate click; assert mock was called with `(channelId, !relayActive)`; set `{ numRuns: 100 }`

  - [x] 6.3 Create `src/components/CurrentUpdateForm.tsx`
    - Props: `{ channelId: string; disabled: boolean; onSubmit: (channelId: string, current: number) => Promise<void> }`
    - Numeric input + submit button; validate with `isValidCurrent` on submit
    - Display inline validation error when value is invalid; clear error when value becomes valid
    - Disable input and button while request is in-flight; re-enable on completion
    - Minimum tap target for submit button: 44×44 px
    - _Requirements: 6.1, 6.3, 6.4, 6.7, 6.8, 8.4_

  - [x] 6.4 Write property test for `CurrentUpdateForm`
    - **Property 7: Channel update invokes API with correct parameters**
    - **Validates: Requirements 6.2**
    - File: `src/__tests__/CurrentUpdateForm.property.test.tsx`
    - Use `fc.constantFrom('A','B','C')` and `fc.float({ min: 0, max: 999.99 })` to generate valid inputs; mock `onSubmit`; type value into input and submit; assert mock was called with `(channelId, parsedValue)`; set `{ numRuns: 100 }`

  - [x] 6.5 Write unit tests for `CurrentUpdateForm`
    - File: `src/__tests__/CurrentUpdateForm.test.tsx`
    - Test: shows validation error for negative value, value > 999.99, NaN
    - Test: clears validation error when corrected to valid value
    - Test: disables input and button while pending
    - _Requirements: 6.3, 6.4, 6.7_

  - [x] 6.6 Create `src/components/ConfirmDialog.tsx`
    - Props: `{ open: boolean; message: string; onConfirm: () => void; onCancel: () => void }`
    - Render via `ReactDOM.createPortal` into `document.body`
    - Render nothing when `open === false`
    - Style: `surface-card` background, `rounded-xl`, 32px padding, semi-transparent overlay
    - _Requirements: 7.2, 7.4_

  - [x] 6.7 Create `src/components/ResetButton.tsx`
    - Props: `{ disabled: boolean; onReset: () => Promise<void> }`
    - Manage internal `pending` boolean and `confirmOpen` boolean
    - On click: set `confirmOpen = true`; on confirm: call `onReset`, set `pending = true`; on cancel: close dialog without calling API
    - 10-second timeout guard: if `onReset` does not resolve within 10 s, re-enable button and surface a timeout error
    - Style: `button-primary` (yellow, black text, `rounded-md`, 40px height)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 8.4_

  - [x] 6.8 Write unit tests for `ResetButton`
    - File: `src/__tests__/ResetButton.test.tsx`
    - Test: clicking opens confirm dialog
    - Test: cancelling dialog does not call `onReset`
    - Test: confirming calls `onReset`
    - Test: button is disabled while pending
    - Test: 10-second timeout re-enables button (use `vi.useFakeTimers()`)
    - _Requirements: 7.2, 7.3, 7.4, 7.7_

- [x] 7. Implement `ChannelCard` and wire control sub-components
  - [x] 7.1 Create `src/components/ChannelCard.tsx`
    - Props: `{ channel: ChannelData | null; disabled: boolean; onRelayChange: (channelId: string, state: boolean) => Promise<void>; onCurrentUpdate: (channelId: string, current: number) => Promise<void> }`
    - When `channel === null`: render `"Data unavailable"` placeholder
    - Card root element: set `data-overload="true"` when `channel.overload === true`, `data-overload="false"` otherwise
    - Display channel identifier (`title-md`, 20px/600), current reading formatted to 2 decimal places + `"A"` (`number-display`, IBM Plex Mono, `trading-up` color normally, `trading-down` when overloaded)
    - Show `"OVERLOAD"` badge (`caption` typography, `trading-down`) when overloaded
    - Render `RelayControl` and `CurrentUpdateForm` as sub-components
    - Style: `surface-card` background, `rounded-xl`, 24px padding; 4px left border in `trading-down` when overloaded, `hairline-dark` otherwise
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [x] 7.2 Write property test for `ChannelCard`
    - **Property 3: ChannelCard renders all fields correctly**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    - File: `src/__tests__/ChannelCard.property.test.tsx`
    - Use `fc.record({ channel: fc.constantFrom('A','B','C'), currentAmps: fc.float({ min: 0, max: 30 }), overload: fc.boolean(), relayActive: fc.boolean() })` to generate `ChannelData`; assert channel identifier visible, current formatted to 2 dp + "A", `data-overload` attribute matches `overload` field, relay label matches `relayActive`; set `{ numRuns: 100 }`

  - [x] 7.3 Write unit tests for `ChannelCard`
    - File: `src/__tests__/ChannelCard.test.tsx`
    - Test: renders `"Data unavailable"` when `channel === null`
    - Test: relay label is `"Connected"` when `relayActive === true`
    - Test: relay label is `"Disconnected"` when `relayActive === false`
    - _Requirements: 2.4, 2.5, 2.7_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Assemble `App` and implement the full layout
  - [x] 9.1 Create `src/components/App.tsx`
    - Call `useTelemetry()` and distribute `data`, `loading`, `error`, `connectionUnavailable`, `triggerPoll` via props
    - Implement `handleRelayChange(channelId, state)`: call `setRelay`, then `triggerPoll` on success; surface `ApiError` as action error
    - Implement `handleCurrentUpdate(channelId, current)`: call `updateChannel`, then `triggerPoll` on success; surface `ApiError` as action error
    - Implement `handleReset()`: call `resetSystem`, then `triggerPoll` on success; surface `ApiError` as action error
    - Disable all relay controls when `connectionUnavailable === true`
    - Layout: top header bar (`canvas-dark`, 64px, yellow accent title), then `ErrorBanner`, then a main grid with `TelemetryPanel`, `OverloadPanel`, channel cards grid (min 2 columns at ≥768 px, single column below), and `ResetButton`
    - Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for channel cards
    - _Requirements: 1.4, 2.6, 3.4, 5.3, 5.4, 5.5, 5.6, 5.7, 6.5, 6.6, 7.5, 7.6, 8.1, 8.2, 8.3, 9.4, 9.5_

  - [x] 9.2 Update `src/main.tsx` to mount `<App />` into `#root` and import `index.css`
    - _Requirements: 1.1_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (9 properties total)
- Unit tests validate specific examples, edge cases, and state transitions
- The Vite dev proxy (`/api → http://localhost:3000`) must be running alongside the API server during development
- Run tests with `vitest --run` from the `frontend/` directory for a single-pass execution

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.4", "2.6", "3.1"] },
    { "id": 2, "tasks": ["2.3", "2.5", "2.7", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "5.3", "5.5"] },
    { "id": 4, "tasks": ["5.2", "5.4", "5.6", "5.7", "6.1", "6.3", "6.6"] },
    { "id": 5, "tasks": ["6.2", "6.4", "6.5", "6.7"] },
    { "id": 6, "tasks": ["6.8", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] }
  ]
}
```
