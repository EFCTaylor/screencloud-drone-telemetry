# ADR 0004: Validate Event-Specific Schemas

## Status

Accepted

## Context

Telemetry event types have different required business fields. A generic schema with many optional fields could accept semantically invalid combinations.

## Decision

Validate a shared event envelope and use a Zod discriminated union on `eventType` for event-specific `telemetryData`.

The initial event types are:

- `LOCATION_UPDATE`: latitude and longitude
- `BATTERY_UPDATE`: battery level
- `DELIVERY_STARTED`: delivery ID
- `DELIVERY_COMPLETED`: delivery ID
- `HEALTH_STATUS_UPDATE`: health status

## Rationale

Separate schemas enforce the correct required fields for each event type while keeping validation concise. For example, a `DELIVERY_COMPLETED` event cannot be accepted without a delivery reference.

## Consequences

Adding an event type requires its own schema and transformation behaviour. `schemaVersion` provides an explicit future evolution path.
