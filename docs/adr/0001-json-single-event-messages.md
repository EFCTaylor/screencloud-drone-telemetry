# ADR 0001: Use JSON Single-Event Messages

## Status

Accepted

## Context

Drone telemetry must be ingested in a format that supports nested data, such as location, while keeping the implementation focused on pipeline reliability rather than format conversion.

## Decision

Each inbound message represents exactly one telemetry event encoded as JSON. It has a shared envelope containing:

- `eventId`: a producer-generated, immutable UUID
- `schemaVersion`
- `droneId`
- `timestamp`
- `eventType`

Event-specific data is contained in `telemetryData`.

## Rationale

JSON is common, straightforward to parse, and supports nested data without unnecessary complexity.

## Consequences

Producers must follow the defined event schema. The `eventId` supports idempotent persistence, but does not prevent duplicate transport delivery.
