# T-003: Implement Idempotent DynamoDB Persistence

## Status

Draft

## Dependencies

- T-001
- T-002

## Related ADRs

- ADR 0005: Enforce Idempotency in the Database
- ADR 0007: Use DynamoDB for Event Storage
- ADR 0012: Apply Least-Privilege IAM Access

## Scope

Implement a small DynamoDB repository using AWS SDK v3. Persist transformed telemetry with `eventId` as the table primary key and a conditional write that prevents an existing event from being overwritten.

Populate the drone history index attributes for every event. Populate `errorIndexPk` with `ERROR` only for `HEALTH_STATUS_UPDATE` events whose status is `WARNING` or `CRITICAL`.

## Acceptance Criteria

- A new event is written using a condition that requires `eventId` not to exist.
- A conditional-check failure caused by an existing `eventId` is returned as a successful duplicate no-op.
- Throttling, connectivity, permission, and unexpected DynamoDB errors remain retryable failures.
- Stored records contain the attributes required by the drone history and sparse error GSIs.
- AWS errors are classified without exposing raw telemetry in logs or returned diagnostics.
- Unit tests cover successful writes, duplicate writes, and retryable DynamoDB failures.

## Out Of Scope

- Query HTTP endpoints
- Updates to persisted telemetry
- A separate idempotency table
- TTL, archival, analytics, or retention policies
- Production partition time-bucketing

## Implementation Choices Requiring Approval

- Whether to store the complete validated `telemetryData` document or flatten event-specific fields
- Behaviour when one `eventId` is reused with different event content
- Exact repository return values and error categories

## Verification

- `npm test -- repository`

## Completion Notes

To be completed after implementation and review.
