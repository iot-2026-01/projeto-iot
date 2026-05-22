# Bugfix Requirements Document

## Introduction

The IoT Dashboard backend shares a single `LoadBalancerModel` instance between HTTP routes and the MQTT subscriber service. This causes three related bugs: (1) MQTT telemetry overwrites manual channel updates made via the "Set" button, (2) overload status set by manual updates is cleared before the frontend can poll it, and (3) the `getTelemetry()` response lacks a `timestamp` field causing `Invalid Date` in the frontend. Additionally, the `updateChannel` HTTP endpoint returns `{ success, channel }` but the frontend expects a plain `ChannelData` object.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user manually sets a channel current via POST /api/load-balancer/channels THEN the system correctly stores the value but the MQTT subscriber overwrites it within ~1 second with the real sensor reading, making the manual update appear non-functional

1.2 WHEN a user sets a channel current above 15A (overload threshold) via POST /api/load-balancer/channels THEN the system sets the overload flag but the next MQTT message (~1 second later) overwrites the channel with the real sensor reading (typically 0A or low), clearing the overload state before the frontend's next 2-second poll can display it

1.3 WHEN the frontend calls GET /api/load-balancer/telemetry THEN the system returns a response without a `timestamp` field, causing `new Date(raw.timestamp)` in the frontend to produce `Invalid Date`

1.4 WHEN the frontend calls POST /api/load-balancer/channels to update a channel current THEN the system returns `{ success: boolean, channel: ChannelData }` but the frontend expects a plain `ChannelData` object as the response body

### Expected Behavior (Correct)

2.1 WHEN a user manually sets a channel current via POST /api/load-balancer/channels THEN the system SHALL mark that channel as "manually overridden" and the MQTT subscriber SHALL NOT overwrite the current value for that channel until the system is reset

2.2 WHEN a user sets a channel current above 15A via POST /api/load-balancer/channels THEN the system SHALL persist the overload flag for that channel and the MQTT subscriber SHALL NOT clear it, so the frontend can observe the overload state on its next poll

2.3 WHEN the frontend calls GET /api/load-balancer/telemetry THEN the system SHALL include a `timestamp` field containing an ISO 8601 string representing the current server time

2.4 WHEN the frontend calls POST /api/load-balancer/channels to update a channel current THEN the system SHALL return a plain `ChannelData` object as the response body (without wrapping in `{ success, channel }`)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the MQTT subscriber receives telemetry for a channel that has NOT been manually overridden THEN the system SHALL CONTINUE TO update that channel's current and overload state from the sensor reading

3.2 WHEN the system is reset via POST /api/load-balancer/reset THEN the system SHALL CONTINUE TO clear all channel states and events, and SHALL also clear all manual override flags so MQTT updates resume for all channels

3.3 WHEN the frontend calls GET /api/load-balancer/channels THEN the system SHALL CONTINUE TO return an array of `ChannelData` objects with the same shape

3.4 WHEN the frontend calls POST /api/load-balancer/relay to set relay state THEN the system SHALL CONTINUE TO return the response in its current format without changes

3.5 WHEN the MQTT subscriber receives telemetry THEN the system SHALL CONTINUE TO sync uptime and relay states from the ESP32 device
