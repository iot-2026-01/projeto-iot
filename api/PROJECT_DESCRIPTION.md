# Smart Load Balancer API Project

## Overview

This Node.js/TypeScript API serves as the backend for the Smart Load Balancer System, an IoT project that monitors electrical currents in three circuits and automatically manages loads to prevent overloads by controlling relays.

## Project Purpose

The API provides a RESTful interface to interact with the load balancing system, allowing external applications to:
- Monitor current readings from three electrical channels (A, B, C)
- Control relay states manually
- Reset system state
- Access telemetry data for monitoring and analytics

## Technology Stack

- **Node.js**: Version 24.x runtime environment
- **Express**: Web framework for handling HTTP requests
- **TypeScript**: Typed JavaScript for better code quality and maintainability
- **OOP Principles**: Object-oriented design patterns for clean architecture

## Project Structure

```
api/
├── src/
│   ├── controllers/                # Controller classes handling HTTP requests
│   │   └── LoadBalancerController.ts
│   ├── models/                     # Business logic and data handling
│   │   └── LoadBalancerModel.ts
│   ├── routes/                     # Route definitions
│   │   └── LoadBalancerRoutes.ts
│   ├── middleware/                 # Error handling and middleware
│   │   └── errorHandling.ts
│   ├── types/                      # TypeScript type definitions
│   │   └── index.ts
│   └── server.ts                   # Main application entry point
├── package.json
├── tsconfig.json
└── PROJECT_DESCRIPTION.md        # This file
```

## Key Features

### 1. Object-Oriented Design
- Models encapsulate business logic and data handling
- Controllers handle HTTP request/response cycles
- Routes define API endpoint mappings
- Clear separation of concerns

### 2. RESTful API Endpoints
- **GET /api/load-balancer/channels** - Retrieve all channel data
- **GET /api/load-balancer/channels/:id** - Retrieve specific channel data
- **POST /api/load-balancer/channels/:id** - Update channel current reading
- **POST /api/load-balancer/relay** - Set relay state for a channel
- **POST /api/load-balancer/reset** - Reset system state

### 3. Telemetry Data
The API provides structured telemetry data that mirrors the system's operation:
- Device identification
- Uptime tracking
- Event counters (overloads, relay changes)
- Channel-specific data (current, overload status, relay state)

## OOP Implementation Principles

### Model Layer
- `LoadBalancerModel` class encapsulates all business logic
- Manages channel data, relay states, and system events
- Handles data validation and business rule enforcement

### Controller Layer
- `LoadBalancerController` handles HTTP requests using OOP patterns
- Provides methods for each API endpoint (getChannels, setRelayState, reset)
- Implements proper error handling and response formatting

### Route Layer
- `LoadBalancerRoutes` class maps HTTP methods to controller methods
- Follows REST conventions for endpoint naming
- Uses Express Router for clean route organization

## System Integration

This API can integrate with:
- Grafana dashboards for real-time monitoring
- Node-RED flows for automation
- ThingsBoard IoT platforms
- Custom web applications for system management

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

## Deployment Considerations

- Node.js 24.x runtime environment required
- Environment variables for configuration (MQTT, database connections)
- Security considerations for production deployment
- Monitoring and logging integration
