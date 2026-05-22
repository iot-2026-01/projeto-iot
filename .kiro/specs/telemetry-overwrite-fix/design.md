# Telemetry Overwrite Fix — Bugfix Design

## Overview

The IoT Dashboard backend shares a single `LoadBalancerModel` instance between HTTP routes and the MQTT subscriber. This causes MQTT telemetry to silently overwrite manual channel updates made via the HTTP API, the telemetry response to lack a `timestamp` field (producing `Invalid Date` on the frontend), and the `updateChannel` endpoint to return a wrapped object instead of the plain `ChannelData` the frontend expects.

The fix introduces a per-channel `manualOverride` flag in the model, guards MQTT writes behind that flag, adds a server-generated `timestamp` to the telemetry response, and normalizes the `updateChannel` response shape.

## Glossary

- **Bug_Condition (C)**: The set of inputs/states where MQTT overwrites a manually-set channel, or where the telemetry response is missing `timestamp`, or where the `updateChannel` response shape is incorrect
- **Property (P)**: After the fix, manually-overridden channels are protected from MQTT writes, telemetry includes a valid ISO timestamp, and `updateChannel` returns plain `ChannelData`
- **Preservation**: Existing behavior for non-overridden channels (MQTT updates flow normally), relay endpoints, reset behavior, and channel listing must remain unchanged
- **LoadBalancerModel**: The in-memory model in `api/src/models/LoadBalancerModel.ts` holding channel state, shared between HTTP and MQTT
- **MqttSubscriberService**: The service in `api/src/services/MqttSubscriberService.ts` that receives ESP32 telemetry and syncs the model
- **manualOverride**: A new per-channel boolean flag indicating the channel was updated via HTTP and should not be overwritten by MQTT

## Bug Details

### Bug Condition

The bug manifests in three scenarios: (1) MQTT overwrites a channel that was just updated via HTTP, (2) the `getTelemetry` response has no `timestamp` field, and (3) `updateChannel` returns `{ success, channel }` instead of plain `ChannelData`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SystemEvent (HTTP request OR MQTT message OR telemetry poll)
  OUTPUT: boolean

  // Scenario 1: MQTT overwrite of manual update
  IF input.type == "MQTT_UPDATE"
     AND channelWasManuallyUpdated(input.channelId)
     RETURN true

  // Scenario 2: Missing timestamp
  IF input.type == "GET_TELEMETRY"
     AND response.timestamp IS undefined
     RETURN true

  // Scenario 3: Wrong response shape
  IF input.type == "POST_UPDATE_CHANNEL"
     AND response HAS "success" key
     AND response HAS "channel" key
     RETURN true

  RETURN false
END FUNCTION
```

### Examples

- **Overwrite**: User sets channel A to 20A via HTTP. Within 1 second, MQTT publishes sensor reading of 2.5A. Channel A is overwritten to 2.5A — the manual update is lost.
- **Overload cleared**: User sets channel B to 16A (above 15A threshold). Overload flag is set. Next MQTT message reports 3A for channel B, clearing the overload before the frontend polls.
- **Invalid Date**: Frontend calls `GET /api/load-balancer/telemetry`. Response has no `timestamp` field. `new Date(undefined)` produces `Invalid Date`.
- **Response shape mismatch**: Frontend calls `POST /api/load-balancer/channels` with `{ channelId: "A", current: 10 }`. Backend returns `{ success: true, channel: { channel: "A", currentAmps: 10, ... } }`. Frontend tries to read `response.channel` (the letter) but gets `undefined` because it expected a flat `ChannelData`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- MQTT updates for channels that have NOT been manually overridden must continue to flow normally (current, overload, relay state)
- System reset (`POST /api/load-balancer/reset`) must continue to clear all channel states, events, and uptime — and must also clear override flags
- `GET /api/load-balancer/channels` must continue to return `ChannelData[]` with the same shape
- `POST /api/load-balancer/relay` must continue to return its current response format
- MQTT subscriber must continue to sync uptime and relay states from the ESP32
- Overload detection logic (15A threshold) must remain unchanged

**Scope:**
All inputs that do NOT involve manually-overridden channels, the telemetry timestamp, or the updateChannel response shape should be completely unaffected by this fix. This includes:
- MQTT updates to non-overridden channels
- Relay state changes via HTTP
- System reset behavior (with the addition of clearing override flags)
- Health check endpoint
- Channel listing endpoint

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **No override tracking in LoadBalancerModel**: The model has no mechanism to distinguish between channels updated via HTTP vs MQTT. Both paths call the same `updateChannel()` method, so MQTT always overwrites HTTP-set values.

2. **MqttSubscriberService unconditionally writes**: `handleMessage()` iterates all channels from the ESP32 payload and calls `model.updateChannel()` and `model.setRelayState()` without checking whether a channel should be protected.

3. **Missing timestamp in getTelemetry()**: `LoadBalancerModel.getTelemetry()` returns `Omit<TelemetryData, 'timestamp'>` — it explicitly excludes the timestamp. The controller's `getTelemetry` handler returns this directly without adding a `timestamp` field.

4. **Wrapped response in updateChannel handler**: The controller returns `{ success: true, channel: channelData }` but the frontend's `updateChannel()` function expects the response to be a plain `ChannelData` object (it calls `handleResponse<ChannelData>(response)`).

## Correctness Properties

Property 1: Bug Condition — Manual Override Protection

_For any_ HTTP channel update followed by an MQTT telemetry message for the same channel, the fixed system SHALL preserve the HTTP-set current value and overload state, ignoring the MQTT update for that channel until the system is reset.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — Telemetry Timestamp Present

_For any_ call to `GET /api/load-balancer/telemetry`, the fixed system SHALL return a response containing a `timestamp` field with a valid ISO 8601 string representing the current server time.

**Validates: Requirements 2.3**

Property 3: Bug Condition — UpdateChannel Response Shape

_For any_ successful call to `POST /api/load-balancer/channels`, the fixed system SHALL return a plain `ChannelData` object as the response body (with fields `channel`, `currentAmps`, `overload`, `relayActive` at the top level).

**Validates: Requirements 2.4**

Property 4: Preservation — Non-Overridden MQTT Updates

_For any_ MQTT telemetry message targeting a channel that has NOT been manually overridden via HTTP, the fixed system SHALL update that channel's current and overload state exactly as the original system did, preserving normal MQTT-driven telemetry flow.

**Validates: Requirements 3.1, 3.5**

Property 5: Preservation — Reset Clears Overrides

_For any_ system reset via `POST /api/load-balancer/reset`, the fixed system SHALL clear all channel states, events, uptime, AND all manual override flags, so that subsequent MQTT updates resume for all channels.

**Validates: Requirements 3.2**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `api/src/models/LoadBalancerModel.ts`

**Changes**:
1. **Add manualOverride map**: Add a `private manualOverrides: Map<string, boolean>` initialized to `false` for each channel (A, B, C).
2. **Add setManualOverride method**: `setManualOverride(channelId: string): void` — sets the override flag for a channel.
3. **Add isManualOverride method**: `isManualOverride(channelId: string): boolean` — returns whether a channel is overridden.
4. **Update reset()**: Clear all entries in `manualOverrides` back to `false`.
5. **Update getTelemetry()**: Return the full `TelemetryData` including a `timestamp: new Date()` field (change return type from `Omit<TelemetryData, 'timestamp'>` to `TelemetryData`).

---

**File**: `api/src/services/MqttSubscriberService.ts`

**Function**: `handleMessage`

**Changes**:
1. **Guard channel updates**: Before calling `model.updateChannel(channelId, ch.current_a)`, check `model.isManualOverride(channelId)`. If `true`, skip the `updateChannel` call for that channel.
2. **Guard relay state updates**: Similarly skip `model.setRelayState(channelId, ch.relay)` for overridden channels (relay state should also be preserved for manually-controlled channels).

---

**File**: `api/src/controllers/LoadBalancerController.ts`

**Function**: `updateChannel`

**Changes**:
1. **Set manual override flag**: After a successful `model.updateChannel()`, call `model.setManualOverride(channelId)` to mark the channel as manually overridden.
2. **Fix response shape**: Change the return from `{ success: true, channel: channel }` to just the `ChannelData` object directly: `return res.status(200).json(channel)`.

**Function**: `getTelemetry`

**Changes**:
1. **Add timestamp**: The model now returns `TelemetryData` with `timestamp` included, so no additional change needed in the controller (or alternatively, add `timestamp: new Date().toISOString()` to the response if keeping the model return type as-is).

---

**File**: `frontend/src/api/loadBalancer.ts`

**Changes**: None required. The frontend already expects `ChannelData` from `updateChannel` and parses `timestamp` from the telemetry response. Once the backend is fixed, the frontend will work correctly.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the sequence of HTTP update followed by MQTT message, check telemetry response shape, and check updateChannel response shape. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **MQTT Overwrite Test**: Set channel A to 20A via HTTP, then simulate MQTT message with 2A for channel A. Assert channel A still reads 20A (will fail on unfixed code — channel will read 2A).
2. **Overload Persistence Test**: Set channel B to 16A via HTTP (triggers overload). Simulate MQTT message with 3A for channel B. Assert overload flag is still `true` (will fail on unfixed code — overload will be cleared).
3. **Timestamp Presence Test**: Call `getTelemetry()` and assert response contains a `timestamp` field that is a valid ISO date string (will fail on unfixed code — field is missing).
4. **Response Shape Test**: Call `updateChannel` endpoint and assert response body has `channel`, `currentAmps`, `overload`, `relayActive` at top level without `success` wrapper (will fail on unfixed code).

**Expected Counterexamples**:
- Channel current reverts to MQTT-reported value after manual HTTP update
- Overload flag is cleared by MQTT within 1 second of being set via HTTP
- `timestamp` field is `undefined` in telemetry response
- Response body contains `{ success: true, channel: {...} }` instead of flat `ChannelData`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
END FOR
```

Specifically:
- For any channel with manualOverride=true, MQTT updates must not change its currentAmps or overload
- For any getTelemetry call, response.timestamp must be a valid ISO 8601 string
- For any updateChannel call, response must be a plain ChannelData object

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-overridden MQTT updates, relay changes, reset, and channel listing, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Non-Overridden MQTT Update Preservation**: For channels without manual override, MQTT updates must continue to set currentAmps and overload exactly as before
2. **Reset Preservation**: After reset, all channels return to defaults (0A, no overload, relay active) — same as before, plus override flags cleared
3. **Channel Listing Preservation**: `GET /api/load-balancer/channels` returns the same `ChannelData[]` shape regardless of override state
4. **Relay Endpoint Preservation**: `POST /api/load-balancer/relay` continues to return `{ success: true, channel: ChannelData }` unchanged

### Unit Tests

- Test `LoadBalancerModel.setManualOverride()` and `isManualOverride()` for each channel
- Test that `reset()` clears override flags
- Test `getTelemetry()` includes a valid `timestamp` field
- Test `updateChannel` controller returns plain `ChannelData`
- Test MQTT handler skips overridden channels
- Test MQTT handler still updates non-overridden channels

### Property-Based Tests

- Generate random sequences of HTTP updates and MQTT messages; verify overridden channels are never modified by MQTT
- Generate random current values (0–30A) and verify overload detection logic is unchanged for non-overridden channels
- Generate random telemetry poll timings and verify timestamp is always a valid ISO string within acceptable clock skew
- Generate random channel configurations and verify reset always returns all channels to default state with overrides cleared

### Integration Tests

- Full flow: HTTP update → MQTT message → GET telemetry → verify channel value persisted
- Full flow: HTTP update → reset → MQTT message → verify MQTT updates resume
- Full flow: Multiple channels, some overridden, some not — verify selective protection
- Frontend integration: verify `useTelemetry` hook correctly parses the new timestamp field
