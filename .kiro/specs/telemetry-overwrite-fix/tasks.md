# Implementation Plan

## Overview

This task list implements the telemetry overwrite bugfix using the exploratory bug condition methodology. The fix addresses three related bugs: (1) MQTT telemetry overwrites manual HTTP channel updates, (2) missing `timestamp` in telemetry response, and (3) incorrect `updateChannel` response shape. The approach writes property-based tests BEFORE the fix to confirm the bugs exist, then implements the fix, then verifies all tests pass.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - MQTT Overwrites Manual Channel Updates
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists across all three bug scenarios
  - **Setup**: Install `fast-check` as a devDependency in `api/` (`npm install --save-dev fast-check`)
  - **Scoped PBT Approach**: For the MQTT overwrite scenario, scope the property to: any channel (A, B, C) that receives an HTTP update followed by an MQTT update
  - **Test file**: `api/src/tests/telemetryOverwrite.property.test.ts`
  - **Test 1 - Manual Override Protection**: Using fast-check, generate arbitrary channel IDs from ["A","B","C"] and arbitrary current values (0–30A). For each: (1) call `model.updateChannel(channelId, httpCurrent)`, (2) simulate MQTT by calling `model.updateChannel(channelId, mqttCurrent)`. Assert that `model.getChannel(channelId).currentAmps` still equals `httpCurrent` (will FAIL on unfixed code — MQTT overwrites the value)
  - **Test 2 - Timestamp Presence**: Call `model.getTelemetry()` and assert the result contains a `timestamp` field that is a valid Date (will FAIL on unfixed code — field is missing, return type is `Omit<TelemetryData, 'timestamp'>`)
  - **Test 3 - Response Shape**: Instantiate controller, mock request with `{ channelId: "A", current: 10 }`, call `updateChannel`. Assert response body has `channel`, `currentAmps`, `overload`, `relayActive` at top level WITHOUT a `success` wrapper (will FAIL on unfixed code — returns `{ success: true, channel: {...} }`)
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct - it proves the bugs exist)
  - Document counterexamples found (e.g., "model.updateChannel('A', 20) then model.updateChannel('A', 2.5) results in currentAmps=2.5 instead of 20")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Overridden MQTT Updates and Reset Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - **Test file**: `api/src/tests/telemetryPreservation.property.test.ts`
  - Observe on UNFIXED code: `model.updateChannel('A', 5.0)` sets currentAmps to 5.0 and overload to false
  - Observe on UNFIXED code: `model.updateChannel('B', 16.0)` sets currentAmps to 16.0 and overload to true, events increments
  - Observe on UNFIXED code: `model.reset()` clears all channels to 0A, overload=false, relayActive=true, events=0
  - Observe on UNFIXED code: `model.getChannels()` returns array of 3 ChannelData objects with correct shape
  - Observe on UNFIXED code: `model.setRelayState('A', false)` sets relayActive to false and returns true
  - **Property test 1 - MQTT update for non-overridden channels**: Using fast-check, generate arbitrary channel IDs from ["A","B","C"] and current values (0–30A). For non-overridden channels, `model.updateChannel(channelId, current)` must set `currentAmps = current` and `overload = (current > 15)`
  - **Property test 2 - Reset clears all state**: Using fast-check, generate arbitrary sequences of updateChannel and setRelayState calls, then call `model.reset()`. Assert all channels return to defaults (currentAmps=0, overload=false, relayActive=true) and events=0
  - **Property test 3 - Channel listing shape**: After any sequence of updates, `model.getChannels()` always returns exactly 3 elements with valid ChannelData shape
  - **Property test 4 - Overload threshold consistency**: For any current value, overload is true iff current > 15
  - Verify all tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 3. Fix for telemetry overwrite bug

  - [x] 3.1 Add manualOverride tracking to LoadBalancerModel
    - Add `private manualOverrides: Map<string, boolean>` initialized to `false` for channels A, B, C
    - Add `setManualOverride(channelId: string): void` method that sets the flag to `true`
    - Add `isManualOverride(channelId: string): boolean` method that returns the override state
    - Update `reset()` to clear all entries in `manualOverrides` back to `false`
    - _Bug_Condition: isBugCondition(input) where input.type == "MQTT_UPDATE" AND channelWasManuallyUpdated(input.channelId)_
    - _Expected_Behavior: Overridden channels are protected from MQTT writes until reset_
    - _Preservation: reset() clears override flags so MQTT resumes for all channels_
    - _Requirements: 2.1, 2.2, 3.2_

  - [x] 3.2 Guard MQTT updates in MqttSubscriberService
    - In `handleMessage()`, before calling `model.updateChannel(channelId, ch.current_a)`, check `model.isManualOverride(channelId)`
    - If `isManualOverride` returns `true`, skip both `model.updateChannel()` and `model.setRelayState()` for that channel
    - Non-overridden channels must continue to be updated normally
    - Uptime sync (`model.syncUptime(data.uptime_ms)`) must remain unconditional
    - _Bug_Condition: isBugCondition(input) where MQTT_UPDATE targets a manually-overridden channel_
    - _Expected_Behavior: MQTT updates are skipped for overridden channels_
    - _Preservation: Non-overridden channels continue to receive MQTT updates; uptime sync unchanged_
    - _Requirements: 2.1, 2.2, 3.1, 3.5_

  - [x] 3.3 Fix updateChannel response shape in LoadBalancerController
    - In `updateChannel()` handler, after successful `model.updateChannel()`, call `model.setManualOverride(channelId)` to mark the channel
    - Change the response from `res.status(200).json({ success: true, channel: channel })` to `res.status(200).json(channel)` — return plain `ChannelData`
    - _Bug_Condition: isBugCondition(input) where input.type == "POST_UPDATE_CHANNEL" AND response HAS "success" key_
    - _Expected_Behavior: Response body is a plain ChannelData object (channel, currentAmps, overload, relayActive at top level)_
    - _Preservation: Relay endpoint response format unchanged_
    - _Requirements: 2.1, 2.4, 3.4_

  - [x] 3.4 Add timestamp to telemetry response
    - Update `LoadBalancerModel.getTelemetry()` return type from `Omit<TelemetryData, 'timestamp'>` to include timestamp
    - Add `timestamp: new Date().toISOString()` to the returned object (ISO 8601 string for JSON serialization)
    - Update the return type annotation to reflect the new shape (return `{ ...telemetry, timestamp: string }` or adjust `TelemetryData` usage)
    - _Bug_Condition: isBugCondition(input) where input.type == "GET_TELEMETRY" AND response.timestamp IS undefined_
    - _Expected_Behavior: response.timestamp is a valid ISO 8601 string representing current server time_
    - _Preservation: All other telemetry fields (device, uptime, events, channels) remain unchanged_
    - _Requirements: 2.3_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - MQTT Overwrites Manual Channel Updates
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (manual override protection, timestamp presence, correct response shape)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Overridden MQTT Updates and Reset Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all preservation tests still pass after fix (no regressions introduced)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npm test` in `api/` directory
  - Ensure all property-based tests pass (both bug condition and preservation)
  - Ensure existing unit tests in `loadBalancerController.test.ts` still pass
  - Verify no TypeScript compilation errors: `npm run build` in `api/` directory
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "tasks": ["1"] },
    { "tasks": ["2"] },
    { "tasks": ["3.1"] },
    { "tasks": ["3.2", "3.3", "3.4"] },
    { "tasks": ["3.5", "3.6"] },
    { "tasks": ["4"] }
  ]
}
```

- Wave 1: Write bug condition exploration test to confirm bugs exist on unfixed code
- Wave 2: Write preservation tests that pass on unfixed code
- Wave 3: Add manualOverride tracking to the model (foundation for other fixes)
- Wave 4: Guard MQTT updates, fix response shape, add timestamp (can be parallel after model changes)
- Wave 5: Verify both exploration and preservation tests pass after fix
- Wave 6: Final checkpoint — full test suite and build verification

## Notes

- **Test framework**: API uses Jest with ts-jest. Install `fast-check` in `api/` for property-based tests.
- **Key files modified**: `LoadBalancerModel.ts`, `MqttSubscriberService.ts`, `LoadBalancerController.ts`
- **No frontend changes needed**: The frontend already expects the correct shapes; fixing the backend resolves the issues.
- **Override lifetime**: Manual overrides persist until system reset (`POST /api/load-balancer/reset`).
- **Overload threshold**: 15A — unchanged by this fix.
