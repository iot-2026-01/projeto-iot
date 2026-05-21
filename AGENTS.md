# AGENTS.md

This document outlines the agent-based architecture and operational rules for the Smart Load Balancing System project.

## Project Overview

The Smart Load Balancing System is an IoT project that monitors electrical currents in three circuits and automatically manages loads to prevent overloads by controlling relays. The system operates on ESP32 hardware with MQTT telemetry capabilities.

## Agent-Based Architecture

### Main System Agent
The primary system agent is responsible for:
- Monitoring current measurements across three channels (A, B, C)
- Detecting overloads based on configurable thresholds
- Controlling relay systems to protect electrical installations
- Managing telemetry publishing via MQTT
- Handling system states (override mode, reset functionality)
- Operating LCD display and user interface

### Component Agents
1. **Current Measurement Agent**
   - Acquires analog readings from SCT-013 sensors
   - Processes RMS calculations across 200 samples per channel
   - Applies conversion factors to calculate amperage

2. **Overload Detection Agent**
   - Monitors current levels against threshold (15A default)
   - Implements hysteresis logic (1.5A default) to prevent oscillation
   - Triggers relay activation when overloads detected

3. **Relay Control Agent**
   - Activates relays to cut load when overloads detected
   - Manages relay states (active-low logic)
   - Handles redistribution logic when overloads clear

4. **Telemetry Agent**
   - Publishes JSON telemetry via MQTT
   - Logs CSV data to serial port
   - Maintains event counters and statistics

5. **User Interface Agent**
   - Manages LCD display modes
   - Handles button inputs (Override, Reset, Mode)
   - Controls status LEDs and buzzer

## Project Rules and Constraints

### Hardware Rules
1. **ESP32 Hardware Requirements**:
   - GPIO 34, 35, 32 for current sensors
   - GPIO 21 (SDA), 22 (SCL) for LCD I2C
   - GPIO 25, 26, 27 for relays (LOW = relay ON)
   - GPIO 18, 19, 23 for overload LEDs (HIGH = alert)
   - GPIO 5 for buzzer
   - GPIO 12, 13, 14 for buttons

2. **Wokwi Simulation**:
   - Uses potentiometers to simulate SCT-013 sensors
   - Wi-Fi uses "Wokwi-GUEST" credentials
   - MQTT broker is "broker.hivemq.com"

### Operational Rules
1. **Overload Threshold**:
   - Default threshold: 15A (configurable)
   - Hysteresis: 1.5A (prevents oscillation)
   - Channel only exits overload state below 13.5A

2. **Relay Management**:
   - Relay logic is active-low (LOW = relay ON)
   - Manual override disables automatic relay control
   - Redistribution logic only active when override is disabled

3. **Telemetry Rules**:
   - MQTT payload format: JSON with device, uptime, events, and channels data
   - Serial output: CSV format (Ch,Current_A,Overload,Relay)
   - Publishing interval: 1 second

### Configuration Rules
1. **Secrets Management**:
   - Copy secrets.h.example to secrets.h before configuration
   - Must contain Wi-Fi credentials and MQTT broker information
   - Device ID should be unique per installation

2. **Build Process**:
   - ESP32 Arduino IDE builds supported
   - Arduino Uno builds available (serial only, no MQTT)
   - Libraries required: LiquidCrystal I2C, PubSubClient

## Integration Points

### MQTT Integration
- Topic: `projeto-iot/<device>/telemetria`
- Format: JSON with device info, uptime, overload status, and channel data
- Broker: HiveMQ public broker or custom MQTT broker

### Dashboard Integration
- Compatible with Grafana, Node-RED, ThingsBoard
- Uses JSON telemetry for real-time monitoring and analytics

## System States

### Normal Operation
- All channels within normal current ranges
- Relays in default state (ON)
- LCD displays live current readings

### Overload State
- One or more channels exceed threshold
- Relays deactivate (cutoff load)
- LEDs illuminate for overload channels
- Buzzer activates with intermittent sound

### Override Mode
- Manual override enabled via button
- Relays remain ON regardless of overload state
- LCD displays override status

### Reset State
- Clears all overload states
- Resets relay, LED, and buzzer states
- Disables manual override mode

## Configuration Parameters

### Adjustable Values in Firmware:
1. OVERLOAD_THRESHOLD - Default 15A
2. HYSTERESIS - Default 1.5A  
3. AMPS_PER_COUNT - Conversion factor
4. SAMPLES / SAMPLE_INTERVAL_US - Measurement precision

## Deployment Rules

### Wokwi Simulation
- Requires no hardware connection
- Pre-configured diagram.json for ESP32 simulation
- Uses built-in Wi-Fi credentials

### Production Deployment
- Hardware sensors (SCT-013) required for real-world use
- Proper electrical installation needed
- MQTT broker must be configured in secrets.h

## Security Considerations

1. **Device Authentication**: Unique device IDs should be used in production
2. **Network Security**: Production deployments should use secure MQTT brokers
3. **Configuration Protection**: secrets.h file should not be committed to version control

## Maintenance Guidelines

1. **Regular Updates**: Firmware updates for improved reliability and features
2. **Calibration**: Periodic sensor calibration for accuracy
3. **Monitoring**: Regular telemetry review for system health
4. **Testing**: Override mode testing for proper system behavior

## Project Structure Reference

For detailed project structure, refer to [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md)