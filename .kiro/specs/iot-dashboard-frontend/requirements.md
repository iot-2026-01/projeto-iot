# Requirements Document

## Introduction

This document defines the requirements for the IoT Dashboard Frontend — a React web application that provides a real-time monitoring and control interface for the Smart Load Balancing System. The dashboard polls the backend API periodically and displays live channel current readings, overload states, relay statuses, and system events. It also exposes manual control actions (relay override, channel current update, and system reset) to operators.

## Glossary

- **Dashboard**: The React single-page application described in this document.
- **API**: The Node.js/TypeScript Express backend at `/api`, exposing endpoints under `/api/load-balancer/`.
- **Channel**: One of three monitored electrical circuits, identified as A, B, or C.
- **ChannelData**: The data structure `{ channel, currentAmps, overload, relayActive }` returned by the API for each channel.
- **TelemetryData**: The data structure `{ device, uptime, events, channels, timestamp }` returned by `GET /api/load-balancer/telemetry`.
- **Overload**: The condition where a channel's current exceeds the 15 A threshold.
- **Hysteresis**: The 1.5 A band below the overload threshold (13.5 A) at which a channel exits the overload state.
- **Relay**: An active-low switch that connects (`relayActive = true`) or disconnects (`relayActive = false`) a channel's load.
- **Poller**: The Dashboard component responsible for periodically fetching data from the API.
- **Event Counter**: The cumulative count of overload and relay-change events reported in `TelemetryData.events`.
- **Override Mode**: A system state in which relay control is manual and automatic overload protection is suspended.
- **Connection Unavailable**: The state in which the Dashboard has marked the API as unreachable due to a timeout or repeated failure, as defined in Requirement 9.

---

## Requirements

### Requirement 1: Periodic Data Polling

**User Story:** As an operator, I want the dashboard to automatically refresh system data, so that I can monitor the load balancer without manually reloading the page.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Poller SHALL begin fetching data from `GET /api/load-balancer/telemetry` at a fixed interval of 2 seconds.
2. WHILE the Dashboard is open, THE Poller SHALL continue fetching data at the configured interval without requiring user interaction.
3. IF a fetch request fails due to a network error, a non-2xx HTTP response, or a timeout exceeding 5 seconds, THEN THE Dashboard SHALL display a visible error indicator; IF no prior successful data exists, THE Dashboard SHALL display an empty/placeholder state rather than stale data.
4. WHEN a fetch request succeeds after a previous failure, THE Dashboard SHALL clear the error indicator and replace the displayed data with the newly received payload.
5. WHEN the Dashboard is unmounted, THE Poller SHALL cancel all pending requests and stop polling.

---

### Requirement 2: Channel Monitoring Panel

**User Story:** As an operator, I want to see the current readings for channels A, B, and C, so that I can assess the electrical load on each circuit at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display a dedicated card for each of the three channels (A, B, C) showing the channel identifier, current reading in amperes (formatted to 2 decimal places with an "A" unit label), overload status, and relay state.
2. WHEN a channel's `overload` field is `true`, THE Dashboard SHALL render that channel's card with a visually distinct overload state attribute (e.g., a `data-overload="true"` attribute or equivalent CSS class) that is distinguishable from the normal state.
3. WHEN a channel's `overload` field is `false`, THE Dashboard SHALL render that channel's card in a normal visual state (overload state attribute absent or set to `false`).
4. WHEN a channel's `relayActive` field is `true`, THE Dashboard SHALL display the relay state as "Connected" for that channel.
5. WHEN a channel's `relayActive` field is `false`, THE Dashboard SHALL display the relay state as "Disconnected" for that channel.
6. WHEN new telemetry data is received, THE Dashboard SHALL update all channel cards within 100 ms of data receipt without requiring a page reload.
7. IF a channel's data is absent from the API response, THEN THE Dashboard SHALL display a "Data unavailable" placeholder for that channel's card rather than rendering stale or empty values.

---

### Requirement 3: Overload Status Panel

**User Story:** As an operator, I want a clear summary of which channels are currently in overload, so that I can quickly identify circuits that need attention.

#### Acceptance Criteria

1. THE Dashboard SHALL display an overload summary section that lists the channel identifier of each channel whose `overload` field is `true` in the most recently received `TelemetryData`.
2. WHEN no channels have `overload` set to `true` in the received telemetry, THE Dashboard SHALL display an "All channels normal" status message in the overload summary section.
3. WHEN one or more channels have `overload` set to `true` in the received telemetry, THE Dashboard SHALL display a summary message stating the count of overloaded channels (e.g., "2 channels in overload") and the identifier of each overloaded channel in the overload summary section.
4. WHEN received telemetry contains a channel with `overload` set to `false` that was previously `true`, THE Dashboard SHALL remove that channel from the overload summary within one render cycle of receiving the updated data.

---

### Requirement 4: Events and Telemetry Panel

**User Story:** As an operator, I want to see system-level telemetry and event information, so that I can understand the overall health and activity of the load balancer.

#### Acceptance Criteria

1. THE Dashboard SHALL display the device identifier from `TelemetryData.device`.
2. THE Dashboard SHALL display the system uptime from `TelemetryData.uptime` (provided in seconds), formatted as a human-readable duration in the form "Xh Ym Zs" (e.g., "1h 23m 45s"); WHEN uptime is 0, THE Dashboard SHALL display "0h 0m 0s".
3. THE Dashboard SHALL display the cumulative event counter from `TelemetryData.events`.
4. THE Dashboard SHALL display the timestamp of the last received telemetry update, formatted as "YYYY-MM-DD HH:MM:SS" in the user's local timezone.
5. WHEN new telemetry data is received, THE Dashboard SHALL update all telemetry fields within 2 seconds of receipt (i.e., before the next poll cycle).
6. BEFORE the first successful poll completes, THE Dashboard SHALL display a loading/placeholder state for all telemetry fields rather than empty or undefined values.

---

### Requirement 5: Manual Relay Control

**User Story:** As an operator, I want to manually set the relay state for a specific channel, so that I can override automatic relay behavior when needed.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a control for each channel that allows the operator to set the relay state to active or inactive.
2. WHEN the operator activates the relay control for a channel, THE Dashboard SHALL send a `POST /api/load-balancer/relay` request with the channel identifier and the desired relay state.
3. WHEN the relay control request succeeds, THE Dashboard SHALL trigger an immediate poll to refresh channel data within one polling cycle (≤ 2 seconds).
4. IF the relay control request fails, THEN THE Dashboard SHALL display an error message identifying the affected channel and the nature of the failure; the error message SHALL persist until the next successful request for that channel or until the operator dismisses it.
5. WHEN a relay control request completes (successfully or with an error), THE Dashboard SHALL re-enable the relay control for that channel.
6. WHILE a relay control request is in progress for a channel, THE Dashboard SHALL disable the relay control for that channel to prevent duplicate submissions.
7. WHILE the Dashboard is in the Connection Unavailable state (as defined in Requirement 9), THE Dashboard SHALL disable all relay controls to prevent futile requests.

---

### Requirement 6: Channel Current Update

**User Story:** As an operator, I want to manually update the current reading for a channel, so that I can simulate or correct sensor values during testing.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field for each channel that accepts a numeric current value in amperes.
2. WHEN the operator submits a current value for a channel, THE Dashboard SHALL send a `POST /api/load-balancer/channels` request with the channel identifier and the provided current value.
3. IF the submitted current value is not a number in the range 0 to 999.99 A (inclusive), THEN THE Dashboard SHALL display a validation error message for that field and SHALL NOT send the request to the API.
4. WHEN the operator corrects a previously invalid value to a valid value, THE Dashboard SHALL clear the validation error message for that field.
5. WHEN the channel update request succeeds, THE Dashboard SHALL trigger an immediate poll to refresh channel data.
6. IF the channel update request fails, THEN THE Dashboard SHALL display an error message identifying the affected channel; the error message SHALL distinguish between a network/connection failure and an API-level rejection (e.g., 4xx response).
7. WHILE a channel update request is in progress, THE Dashboard SHALL disable the corresponding input and submit action to prevent duplicate submissions.
8. WHEN a channel update request completes, whether successfully or with an error, THE Dashboard SHALL re-enable the corresponding input and submit action.

---

### Requirement 7: System Reset

**User Story:** As an operator, I want to reset the system state, so that I can clear all overload flags and return relays to their default state.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a reset action that sends a `POST /api/load-balancer/reset` request.
2. WHEN the operator initiates the reset action, THE Dashboard SHALL display a confirmation prompt before sending the request.
3. WHEN the operator confirms the reset, THE Dashboard SHALL send the `POST /api/load-balancer/reset` request.
4. WHEN the operator cancels the confirmation prompt, THE Dashboard SHALL dismiss the prompt and SHALL NOT send the reset request.
5. WHEN the reset request succeeds, THE Dashboard SHALL trigger an immediate poll to refresh all displayed data within ≤ 2 seconds.
6. IF the reset request fails, THEN THE Dashboard SHALL display an error message describing the failure; the error message SHALL be dismissible by the operator.
7. WHILE the reset request is in progress, THE Dashboard SHALL disable the reset action to prevent duplicate submissions; IF the request does not complete within 10 seconds, THE Dashboard SHALL re-enable the reset action and display a timeout error message.

---

### Requirement 8: Responsive Layout

**User Story:** As an operator, I want the dashboard to be usable on both desktop and tablet screens, so that I can monitor the system from different devices.

#### Acceptance Criteria

1. THE Dashboard SHALL render without horizontal scrolling, overlapping elements, or clipped text on viewport widths from 768 px to 1920 px.
2. WHEN the viewport width is 768 px or wider, THE Dashboard SHALL display channel cards in a grid layout with a minimum of 2 columns.
3. IF the viewport width is below 768 px, THEN THE Dashboard SHALL display channel cards in a single-column stacked layout.
4. THE Dashboard SHALL render all interactive controls (buttons, inputs, toggles) with a minimum tap/click target size of 44 × 44 px across all supported viewport widths.

---

### Requirement 9: API Error Handling

**User Story:** As an operator, I want the dashboard to clearly communicate API errors, so that I know when the system is unreachable or returning unexpected responses.

#### Acceptance Criteria

1. IF any API request returns an HTTP status code of 4xx or 5xx, THEN THE Dashboard SHALL display an error message that includes the HTTP status code and the error description returned by the API.
2. IF any API request does not receive a response within 5 seconds, THEN THE Dashboard SHALL display a timeout-specific error message, display a general "Connection unavailable" message, and set the Dashboard to the Connection Unavailable state.
3. WHILE an error state is active, THE Dashboard SHALL continue attempting to poll the API at the configured 2-second interval.
4. THE Dashboard SHALL label polling errors (data refresh failures) distinctly from control action errors (relay, channel update, or reset failures) in the error messages displayed to the operator.
5. WHEN a previously failing API request succeeds, THE Dashboard SHALL clear the corresponding error message and, IF the Dashboard was in the Connection Unavailable state, SHALL exit that state.
