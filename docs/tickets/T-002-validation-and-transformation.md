# T-002: Validate and Transform Telemetry Events

## Status

Done

## Dependencies

- T-001

## Related ADRs

- ADR 0001: Use JSON Single-Event Messages
- ADR 0003: Use JavaScript, Node.js, and Zod
- ADR 0004: Validate Event-Specific Schemas
- ADR 0011: Use Structured Logging Without Raw Telemetry

## Scope

Implement a small module that parses one JSON message body and validates its shared envelope and event-specific `telemetryData`. The parsed Zod result is the storage-ready event; transformation is limited to returning that validated structure rather than introducing a separate mapping framework.

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
- A valid event returns a storage-ready object containing only validated fields without mutating the input.
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

- Health status values are `HEALTHY`, `WARNING`, and `CRITICAL`.
- Unknown envelope and telemetry fields are stripped from validated events.
- Battery level is constrained to 0-100, latitude to -90-90, longitude to -180-180, and drone and delivery identifiers must be non-empty.

## Verification

- `npm test -- telemetry`

## Completion Notes

- Added `src/telemetry.js` with JSON parsing, event-specific Zod validation, unknown-field stripping, and safe structured diagnostics.
- Added unit coverage for valid and invalid examples of all five event types, envelope validation, malformed JSON, unknown-field handling, input immutability, and diagnostic safety.
- `npm test -- telemetry` and the complete `npm test` unit suite pass on the pinned Node.js `v20.20.2` runtime (19 tests).
- Manually invoked `parseTelemetryEvent` with a valid `BATTERY_UPDATE` JSON message and confirmed it returned the expected storage-ready event with `success: true`.
