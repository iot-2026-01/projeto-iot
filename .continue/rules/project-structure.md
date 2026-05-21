---
description: Describes the project structure rules
---

# RULES.md

This document outlines the operational rules and best practices for the Smart Load Balancing System IoT project, focusing on MQTT implementation and general IoT design principles.

## MQTT Best Practices Implementation

### Topic Structure Rules

**Rule 1: Use hierarchical topic organization**

*Justification*: Hierarchical topics provide clear organization and make it easier to filter and subscribe to specific data streams. For our project, we use the pattern `projeto-iot/<device_id>/telemetria` which allows for easy expansion if we add more devices or features in the future.

**Rule 2: Keep topic names concise but descriptive**

*Justification*: MQTT brokers have limits on topic name length. Short, descriptive names improve readability and reduce bandwidth usage while maintaining clarity for developers.

**Rule 3: Use consistent naming conventions**

*Justification*: Consistent naming makes the system predictable and easier to understand. All topics use lowercase letters and hyphens, which is a widely accepted convention in MQTT implementations.

### Message Quality of Service (QoS)

**Rule 4: Use QoS 1 for telemetry messages**

*Justification*: For our college project, QoS 1 provides reliable delivery without the overhead of QoS 2. Since telemetry data is collected every second and a lost packet would just mean one data point is missed, QoS 1 strikes the right balance between reliability and efficiency. QoS 0 would risk missing important data points, while QoS 2 is unnecessarily complex for this use case.

**Rule 5: Implement proper message acknowledgments**

*Justification*: Even though QoS 1 provides at-least-once delivery, proper acknowledgment handling ensures that our system can detect when messages are not being delivered and potentially trigger reconnection logic or logging.

### Payload Format Rules

**Rule 6: Use JSON for structured data**

*Justification*: JSON is human-readable, widely supported, and easily parsed by various dashboard tools (Grafana, Node-RED, ThingsBoard) that our project aims to support. It also allows for easy expansion of data fields without requiring changes to the message structure.

**Rule 7: Include essential metadata in payloads**

*Justification*: Including device identifier, timestamp (when available), and uptime provides context for data consumers. This makes it easier to correlate data from multiple sources if the system expands in the future.

**Rule 8: Keep payloads small and efficient**

*Justification*: For a college project using Wokwi free tier, minimizing payload size reduces bandwidth usage and improves performance. Our current payload is approximately 200-300 bytes, which is very efficient for the amount of data being transmitted.

### Connection Management Rules

**Rule 9: Implement clean session with proper reconnection logic**

*Justification*: For a small college project, clean sessions prevent accumulation of stale subscriptions and messages. The reconnection logic ensures the system can recover from temporary network disruptions without requiring manual intervention.

**Rule 10: Use appropriate keep-alive intervals**

*Justification*: Setting a reasonable keep-alive interval (e.g., 60 seconds) ensures that the MQTT broker can detect when a client has disconnected unexpectedly. For our ESP32 project, this is appropriate as it doesn't need to send messages more frequently than once per second.

### Security and Authentication Rules

**Rule 11: Use simple credentials for development environments**

*Justification*: For a college project using Wokwi free tier and HiveMQ, simple username/password authentication is sufficient. The focus should be on learning IoT concepts rather than implementing enterprise-grade security features.

**Rule 12: Avoid storing sensitive credentials in source code**

*Justification*: Our project uses a secrets.h.example file pattern, which is a standard practice in IoT development. This prevents accidentally committing sensitive information to version control while providing clear instructions for configuration.

### Performance Optimization Rules

**Rule 13: Publish at appropriate intervals**

*Justification*: Publishing telemetry every second (as currently implemented) provides sufficient data for real-time monitoring without overwhelming the MQTT broker or consuming excessive power. This balance is appropriate for a college IoT project.

**Rule 14: Use retained messages sparingly**

*Justification*: For a college project, we avoid using retained messages to keep implementation simple. The system can recover lost data by re-subscribing and receiving new messages, which is acceptable for development purposes.

### Error Handling and Logging Rules

**Rule 15: Implement basic error logging**

*Justification*: For a college project, basic error logging (to serial output) provides visibility into system behavior without requiring complex logging infrastructure. This helps in debugging and understanding system operation.

**Rule 16: Use meaningful error codes or descriptions**

*Justification*: Clear error descriptions in logs make troubleshooting easier for developers and system administrators. This is particularly important when learning IoT concepts.

## IoT Project Design Principles

### Device-to-Cloud Communication

**Rule 17: Maintain device state consistency**

*Justification*: Our system ensures that the MQTT payload accurately reflects the current state of the device (relays, overload conditions, etc.). This consistency is crucial for reliable dashboard monitoring and automated systems.

### Data Integrity and Reliability

**Rule 18: Implement data validation before publishing**

*Justification*: Validating current measurements and calculated values before publishing ensures that only accurate data is sent to the MQTT broker. This prevents false alerts and maintains data quality for dashboard applications.

### Resource Management

**Rule 19: Minimize power consumption in embedded systems**

*Justification*: For ESP32-based IoT devices, managing power consumption is important. Our approach of publishing once per second rather than continuously balances data frequency with energy efficiency appropriate for embedded IoT systems.

## Implementation Guidelines

### MQTT Client Configuration

**Rule 20: Configure client with appropriate buffer sizes**

*Justification*: For ESP32 development, setting appropriate buffer sizes prevents memory issues while ensuring reliable message handling. The current implementation is optimized for the ESP32's capabilities and memory constraints.

### Testing and Validation

**Rule 21: Validate MQTT connectivity during system initialization**

*Justification*: Validating MQTT connection status during boot ensures that the telemetry system is functional before the device begins normal operation. This prevents silent failures where telemetry might not be sent despite system startup.

## Project-Specific Considerations

### Wokwi Simulation Environment

**Rule 22: Adapt to simulation constraints**

*Justification*: The Wokwi environment uses "Wokwi-GUEST" credentials and "broker.hivemq.com" as the default MQTT broker. This configuration allows students to immediately start testing without complex setup, which is appropriate for educational purposes.

### Development Workflow

**Rule 23: Support both simulation and hardware deployment**

*Justification*: The project supports both Wokwi simulation and real hardware deployment, which is ideal for educational projects where students can learn concepts in a simulated environment before testing on actual hardware.

## References and Standards

### MQTT Version Compatibility

**Rule 24: Use MQTT 3.1.1 or later**

*Justification*: MQTT 3.1.1 is widely supported, stable, and provides all necessary features for this IoT project. It's appropriate for college-level projects where the focus is on learning rather than cutting-edge MQTT features.

### Industry Best Practices

**Rule 25: Follow the principle of least privilege**

*Justification*: For educational purposes, our MQTT configuration uses minimal permissions necessary for the system to function. This teaches students that IoT systems should not have unnecessary access rights, which is a fundamental security principle.

These rules and best practices provide a foundation for implementing robust MQTT communication in IoT projects while keeping the implementation simple and educational, appropriate for college-level development.