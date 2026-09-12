# T-003: Save Telemetry Events in DynamoDB

## Status

Done

## Dependencies

- T-001
- T-002

## Related ADRs

- ADR 0005: Enforce Idempotency in the Database
- ADR 0007: Use DynamoDB for Event Storage
- ADR 0012: Apply Least-Privilege IAM Access

## Scope

Create one small module that uses AWS SDK v3 to save validated events in DynamoDB. Use `eventId` as the table's unique ID. Only save an event when that ID does not already exist, so receiving the same event again cannot overwrite it. Do not add a generic database layer or persistence framework.

Keep `droneId` and `timestamp` on every saved event so events can be searched by drone and time. Add `errorIndexPk` with the value `ERROR` only to `HEALTH_STATUS_UPDATE` events with a `WARNING` or `CRITICAL` status. This allows those health events to be found through the error index.

## Acceptance Criteria

- Save a new event only when its `eventId` does not already exist.
- If the `eventId` already exists, do not save it again. Return a `duplicate` result and treat it as successfully handled.
- Let capacity, connection, permission, and unexpected DynamoDB errors pass back to the caller so T-004 can retry them.
- Every saved event contains the fields needed to search by drone and time. Only warning and critical health events contain the field needed for the error search index.
- Handle an existing `eventId` differently from every other DynamoDB error.
- Unit tests cover new events, duplicate events, and DynamoDB errors that need to be retried.

## Out Of Scope

- HTTP endpoints for searching events
- Changing events after they have been saved
- A separate table for tracking duplicate events
- Checking whether a producer reused an `eventId` for different event data
- TTL, archival, analytics, or retention policies
- Splitting production data into time-based groups

## Implementation Choices Requiring Approval

- Return `{ status: "stored" }` for a new event and `{ status: "duplicate" }` when the event already exists.

## Verification

- `npm test -- persistence`

## Completion Notes

- Added `src/persistence.js` to save new events, add the health-error search field when needed, and treat duplicates as successful outcomes.
- Added unit tests for new and duplicate events, warning and critical health events, healthy events, and DynamoDB errors that must be retried.
- `npm test -- persistence` and the complete `npm test` unit suite pass on the pinned Node.js `v20.20.2` runtime (28 tests).
- Manually called `persistTelemetryEvent` with a `WARNING` health event. Confirmed that the DynamoDB command included `errorIndexPk: "ERROR"` and `attribute_not_exists(eventId)`, a successful write returned `{ status: "stored" }`, and an existing event returned `{ status: "duplicate" }`.
