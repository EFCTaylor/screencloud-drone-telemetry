# T-002: Parse and Validate Telemetry Events

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

Create a small module that accepts one JSON message containing one telemetry event. Check the fields shared by every event and check that `telemetryData` contains the right fields for its `eventType`. Return Zod's validated object directly for storage instead of adding a separate transformation framework.

Support these event types:

- `LOCATION_UPDATE` with latitude and longitude
- `BATTERY_UPDATE` with battery level
- `DELIVERY_STARTED` with delivery ID
- `DELIVERY_COMPLETED` with delivery ID
- `HEALTH_STATUS_UPDATE` with health status

When a message is invalid, return the failed field paths and validation rules in a structured format. Do not include rejected telemetry values in these details.

## Acceptance Criteria

- Every event requires a UUID `eventId`, a `droneId`, an ISO-8601 `timestamp`, and a supported `eventType`.
- Zod uses `eventType` to choose the correct rules for `telemetryData`.
- Reject missing fields, broken JSON, unknown event types, and invalid values. These are permanent data problems and should not be retried unchanged.
- Return a valid event in a form that can be saved directly, containing only checked fields and without changing the input.
- Remove unknown or unchecked fields so they cannot be saved accidentally.
- Unit tests cover valid and invalid examples for all five event types.
- Unit tests confirm that validation details do not contain telemetry values.

## Out Of Scope

- CSV or file ingestion
- Multiple telemetry events in one message
- Schema versioning or backward compatibility
- Saving events or making AWS SDK calls
- Business workflows or alert generation
- A generic `statusCode` field

## Implementation Choices Requiring Approval

- Accept `HEALTHY`, `WARNING`, and `CRITICAL` as health status values.
- Remove unknown top-level and telemetry fields from valid events.
- Accept battery levels from 0 to 100, latitudes from -90 to 90, and longitudes from -180 to 180. Drone and delivery IDs cannot be empty.

## Verification

- `npm test -- telemetry`

## Completion Notes

- Added `src/telemetry.js` to parse JSON, validate each event type, remove unknown fields, and return safe validation details.
- Added unit tests for valid and invalid examples of all five event types, shared event fields, broken JSON, unknown fields, unchanged input, and safe validation details.
- `npm test -- telemetry` and the complete `npm test` unit suite pass on the pinned Node.js `v20.20.2` runtime (19 tests).
- Manually called `parseTelemetryEvent` with a valid `BATTERY_UPDATE` JSON message and confirmed that it returned the expected event with `success: true`.
