# Autonomous Drone Telemetry Pipeline

## Overview

This project implements an event-driven backend pipeline for processing telemetry data received from a fleet of autonomous delivery drones.

The system is responsible for:

- Ingesting incoming drone telemetry events
- Parsing and validating incoming data
- Transforming valid events into a consistent internal format
- Persisting processed telemetry for later querying and analysis
- Handling malformed or incomplete events safely
- Providing clear logging and error handling

The solution has been designed with simplicity, reliability and future scalability in mind.

## Architecture

The pipeline follows the general flow:

```text
Telemetry Event
      |
      v
   Ingestion
      |
      v
  Validation
      |
      v
Transformation
      |
      v
 Persistence
```

### Ingestion

[Describe the ingestion mechanism chosen here.]

I chose this approach because:

[Explain why this mechanism is appropriate for telemetry data and an event-driven system.]

### Processing

Incoming telemetry records are passed through a processing layer responsible for:

1. Parsing the incoming event
2. Validating required fields and field formats
3. Rejecting or handling malformed records
4. Transforming valid events into the internal telemetry model
5. Passing valid records to the persistence layer

Keeping this logic separate from the ingestion mechanism makes the core processing logic easier to test and reduces coupling between infrastructure and business logic.

### Validation

Telemetry data cannot be assumed to be complete or valid.

The application therefore validates incoming records before attempting to persist them.

Examples include:

- Required fields
- Valid timestamps
- Recognised event types
- Valid status codes
- Appropriate telemetry values

Invalid events are logged and handled without preventing subsequent events from being processed.

## Data Storage

[Database/storage technology]

The processed telemetry model contains fields such as:

```text
droneId
timestamp
eventType
statusCode
telemetryData
```

I chose [database] because [reason].

The schema is designed with potential access patterns in mind, including:

- Retrieving events for a particular drone
- Retrieving events within a time period
- Identifying particular event or error types

## Technology Choices

### Language

[TypeScript / JavaScript]

I chose [language] because [reason].

### Infrastructure

[Docker / Docker Compose / Terraform / other approach]

The application can be run locally without requiring access to a deployed cloud environment.

### Testing

[Testing framework]

Unit tests cover the core processing behaviour, particularly:

- Valid telemetry records
- Missing required fields
- Invalid field formats
- Transformation of valid events
- Error-handling behaviour

External infrastructure dependencies are mocked where appropriate so that the core processing logic can be tested independently.

## Running Locally

### Prerequisites

- Node.js [version]
- npm
- Docker
- Docker Compose

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

Install dependencies:

```bash
npm install
```

### Start Local Dependencies

```bash
docker compose up -d
```

### Run the Application

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

## Example Telemetry Event

```json
{
  "droneId": "drone-123",
  "timestamp": "2026-09-07T12:30:00Z",
  "eventType": "DELIVERY_COMPLETED",
  "statusCode": 200,
  "telemetryData": {
    "batteryLevel": 72,
    "location": {
      "latitude": 54.5973,
      "longitude": -5.9301
    }
  }
}
```

## Error Handling

The pipeline assumes that telemetry data may occasionally be incomplete, malformed or corrupted.

Invalid records are therefore handled independently rather than causing the entire processing pipeline to fail.

[Describe final error-handling/retry/dead-letter strategy here.]

## Assumptions

For the purposes of this challenge I have made the following assumptions:

- Telemetry events can arrive independently and potentially at high volume.
- Invalid telemetry should not prevent valid events from being processed.
- Events should be stored in a format that allows efficient retrieval by drone and time.
- The local implementation represents an architecture that could later be deployed into a cloud environment.

## Production Considerations

Given additional time, I would consider:

- Authentication and authorisation
- Retry and dead-letter handling
- Idempotency and duplicate event handling
- Monitoring, metrics and alerting
- Structured production logging
- Infrastructure deployment through CI/CD
- Load and performance testing
- Data retention and archival policies

## AI Usage

AI-assisted development tools were used during this challenge.

I used AI to support tasks such as:

- Exploring implementation approaches
- Reviewing architecture decisions
- Generating or refining boilerplate
- Reviewing tests and edge cases
- Improving documentation

All architectural and implementation decisions were reviewed and understood before being included in the solution.
