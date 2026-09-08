# T-002: Validate and Transform Telemetry Events

## Status

Draft

## Dependencies

- T-001

## Related ADRs

- ADR 0001: Use JSON Single-Event Messages
- ADR 0003: Use JavaScript, Node.js, and Zod
- ADR 0004: Validate Event-Specific Schemas
- ADR 0011: Use Structured Logging Without Raw Telemetry

## Scope

Implement pure functions that parse one JSON message body, validate its shared envelope, validate event-specific `telemetryData`, and transform valid input into a consistent persistence model.

Support these event types:

- `LOCATION_UPDATE` with latitude and longitude
- `BATTERY_UPDATE` with battery level
- `DELIVERY_STARTED` with delivery ID
- `DELIVERY_COMPLETED` with delivery ID
- `HEALTH_STATUS_UPDATE` with health status

Return structured validation diagnostics containing safe field paths and rules without echoing rejected values.

## Acceptance Criteria

- The shared envelope requires a UUID `eventId`, `droneId`, ISO-8601 `timestamp`, and recognized `eventType`.
- Zod uses `eventType` to select the correct event-specific schema.
- Missing required fields, malformed JSON, unknown event types, and invalid field values are rejected as permanent data failures.
- A valid event is transformed without mutating the input.
- Unknown or unvalidated payload fields are not persisted accidentally.
- Unit tests cover valid and invalid examples for all five event types.
- Unit tests confirm diagnostics do not contain telemetry values.

## Out Of Scope

- CSV or file ingestion
- Multiple telemetry events in one message body
- Schema versioning or backward compatibility
- Persistence and AWS SDK calls
- Business workflows or alert generation
- A generic `statusCode` field

## Implementation Choices Requiring Approval

- Exact health status enum values
- Strict rejection or stripping of unknown fields
- Battery, coordinate, and identifier constraints
- Exact normalized persistence shape, coordinated with T-003

## Verification

- `npm test -- validation`
- `npm test -- transformation`

## Completion Notes

To be completed after implementation and review.
