# T-003: Implement Idempotent DynamoDB Persistence

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

Implement one small DynamoDB persistence module using AWS SDK v3. Persist the validated event document with `eventId` as the table primary key and a conditional write that prevents an existing event from being overwritten. Do not add a generic repository interface or persistence framework.

Populate the drone history index attributes for every event. Populate `errorIndexPk` with `ERROR` only for `HEALTH_STATUS_UPDATE` events whose status is `WARNING` or `CRITICAL`.

## Acceptance Criteria

- A new event is written using a condition that requires `eventId` not to exist.
- A conditional-check failure caused by an existing `eventId` is returned as a successful duplicate no-op.
- Throttling, connectivity, permission, and unexpected DynamoDB errors remain retryable failures.
- Stored records contain the attributes required by the drone history and sparse error GSIs.
- A conditional-check failure is handled separately from every other DynamoDB error; other errors are allowed to propagate for retry handling in T-004.
- Unit tests cover successful writes, duplicate writes, and retryable DynamoDB failures.

## Out Of Scope

- Query HTTP endpoints
- Updates to persisted telemetry
- A separate idempotency table
- Detecting conflicting content when a producer reuses an existing `eventId`
- TTL, archival, analytics, or retention policies
- Production partition time-bucketing

## Implementation Choices Requiring Approval

- Persistence returns `{ status: "stored" }` for a new event and `{ status: "duplicate" }` for an existing event.

## Verification

- `npm test -- persistence`

## Completion Notes

- Added `src/persistence.js` with conditional DynamoDB writes, sparse health-error index attributes, and successful duplicate handling.
- Added unit coverage for stored and duplicate outcomes, warning and critical sparse-index entries, healthy events, and propagation of retryable dependency errors.
- `npm test -- persistence` and the complete `npm test` unit suite pass on the pinned Node.js `v20.20.2` runtime (28 tests).
- Manually invoked `persistTelemetryEvent` with a `WARNING` health event and confirmed the command included `errorIndexPk: "ERROR"` and `attribute_not_exists(eventId)`, a successful write returned `{ status: "stored" }`, and a conditional-check failure returned `{ status: "duplicate" }`.
