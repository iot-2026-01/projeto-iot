# Node.js Backend API Implementation Rules

## Project Overview
This document outlines the implementation rules for a Node.js 24.x backend API for the Smart Load Balancing System IoT project.

## Technology Stack
- Node.js 24.x
- Express Framework
- TypeScript
- RESTful API Design

## Architecture Rules

### 1. OOP Pattern Implementation
All route handlers must be implemented using OOP patterns:
- Route classes should encapsulate related functionality
- Controllers should handle request/response logic
- Models should contain business logic and data handling
- Middleware should provide cross-cutting concerns

### 2. Directory Structure
```
api/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── types/
│   │   └── index.ts          # Type definitions
│   ├── models/
│   │   └── LoadBalancerModel.ts # Business logic and data handling
│   ├── controllers/
│   │   └── LoadBalancerController.ts # Request handling
│   ├── routes/
│   │   └── loadBalancerRoutes.ts # Route definitions
│   ├── middleware/
│   │   ├── errorHandler.ts   # Error handling middleware
│   │   └── validateRequest.ts # Request validation middleware
│   └── tests/
│       └── loadBalancerController.test.ts # Unit tests
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Documentation
```

### 3. Route Organization
All routes should be in a specific file and follow OOP patterns:
- Routes must be defined in dedicated route classes
- Route classes should encapsulate related endpoints
- Route methods should delegate to controllers
- All routes must follow REST conventions

### 4. TypeScript Implementation
- Use strict TypeScript compilation
- Implement proper type definitions in types/ directory
- Ensure all API responses are strongly typed
- Use interfaces for request/response objects

### 5. OOP Implementation Requirements
1. Route classes must encapsulate related functionality
2. Controllers must handle request/response logic using OOP principles
3. Models must contain business logic and data handling with proper encapsulation
4. All classes must follow single responsibility principle
5. Inheritance and composition patterns may be used where appropriate

### 6. Error Handling
- Implement centralized error handling middleware
- Return proper HTTP status codes (200, 400, 500)
- Provide meaningful error messages
- Log errors appropriately

### 7. API Endpoints
All endpoints must follow the pattern:
- GET /api/load-balancer/telemetry - Retrieve telemetry data
- GET /api/load-balancer/channels - Retrieve all channel data  
- POST /api/load-balancer/channels - Update channel data
- POST /api/load-balancer/relay - Set relay state for a channel
- POST /api/load-balancer/reset - Reset system state
- GET /health - Health check endpoint

### 8. Testing Requirements
- Unit tests for all controller methods
- Test coverage must include all OOP patterns
- Use Jest for testing framework
- Follow AAA pattern (Arrange, Act, Assert)