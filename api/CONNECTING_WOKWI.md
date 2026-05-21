# Connecting Wokwi Simulation to Load Balancer API

This document explains how to connect your Wokwi ESP32 simulation to the Node.js Load Balancer API.

## Overview

The Smart Load Balancing System allows you to monitor and control electrical circuits through:
1. Wokwi simulation (sensors, relays, and UI)
2. Node.js API backend for data management and control

## Wokwi Setup Instructions

### 1. Configure Wokwi Simulation
In your Wokwi project, ensure the following configuration:

**Hardware Setup:**
- ESP32 microcontroller
- Potentiometers to simulate SCT-013 sensors (GPIO 34, 35, 32)
- LCD display with I2C (GPIO 21, 22)
- Relays connected to GPIO 25, 26, 27 (active-low logic)
- Overload LEDs on GPIO 18, 19, 23 (active-high logic)
- Buzzer on GPIO 5
- Buttons on GPIO 12, 13, 14

**Wi-Fi Configuration:**
- Wi-Fi credentials: "Wokwi-GUEST"
- MQTT broker: "broker.hivemq.com"

### 2. API Configuration

Before running the API, set up environment variables:

```bash
export DEVICE_ID="wokwi-device-001"
export PORT=3000
```

### 3. Running the API Server

Start the Node.js API:

```bash
# Install dependencies
npm install

# Build the project (optional)
npm run build

# Start in development mode
npm run dev
```

The API will be accessible at `http://localhost:3000`

## Communication Flow

### From Wokwi to API:
1. **Telemetry Collection**: Wokwi collects current measurements from sensors
2. **Data Publishing**: Sends telemetry data to the API via HTTP POST requests
3. **Control Commands**: Receives relay control commands from the API

### From API to Wokwi:
1. **Relay Control**: Sends commands to activate/deactivate relays
2. **System State**: Updates override mode and reset status

## Testing the Connection

### 1. Start API Server
```bash
npm run dev
```

### 2. Verify API is Running
Open a browser or use curl to test:
```bash
curl http://localhost:3000/health
```

You should receive a response like:
```json
{
  "status": "OK",
  "message": "Load Balancer API is healthy",
  "device": "wokwi-device-001"
}
```

### 3. Test Telemetry Endpoints
```bash
curl http://localhost:3000/api/load-balancer/telemetry
```

### 4. Test Channel Updates (Simulate Wokwi Data)
```bash
curl -X POST http://localhost:3000/api/load-balancer/channels \
  -H "Content-Type: application/json" \
  -d '{"id":"A","current":12.5}'
```

## Wokwi Integration Points

### 1. Sensor Data Integration
The Wokwi simulation should send sensor data to the API in this format:
```json
{
  "id": "A",
  "current": 12.5
}
```

### 2. Relay Control Integration
The API can send relay control commands to Wokwi:
```json
{
  "channelId": "A",
  "state": false  // false = relay off (cutoff), true = relay on (normal)
}
```

### 3. System Control Integration
```json
{
  "mode": true  // true = override mode enabled, false = normal operation
}
```

## API Endpoints Reference

### Telemetry Endpoints:
- `GET /api/load-balancer/telemetry` - Retrieve current telemetry data
- `GET /api/load-balancer/channels` - Get all channel status

### Control Endpoints:
- `POST /api/load-balancer/channels` - Update channel data
- `POST /api/load-balancer/relay` - Control relay state
- `POST /api/load-balancer/reset` - Reset system state
- `POST /api/load-balancer/override` - Set override mode

## Troubleshooting

### Common Issues:

1. **Connection Refused**: Ensure the API server is running on port 3000
2. **Invalid Data Format**: Check that JSON payloads match the expected structure
3. **Device ID Mismatch**: Ensure DEVICE_ID environment variable matches configuration

### Debugging Tips:
- Use `npm run dev` for real-time logging
- Monitor console output for error messages
- Test individual endpoints with curl or Postman
- Check firewall settings if running on different machines

## Security Considerations

For production use, implement proper authentication and authorization mechanisms to secure the API endpoints.