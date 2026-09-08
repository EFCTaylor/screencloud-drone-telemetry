# T-004: Implement the SQS Consumer and Error Routing

## Status

Draft

## Dependencies

- T-002
- T-003

## Related ADRs

- ADR 0002: Use SQS and Lambda for Ingestion
- ADR 0005: Enforce Idempotency in the Database
- ADR 0006: Separate Data Quarantine from Processing DLQ
- ADR 0008: Limit Retryable Processing to Five Attempts
- ADR 0011: Use Structured Logging Without Raw Telemetry

## Scope

Implement a thin Lambda handler that processes SQS records independently and returns an SQS partial batch response.

Persist valid events, acknowledge duplicate events, and publish malformed or schema-invalid events to the quarantine queue. A quarantine message must contain the raw source message, a safe structured failure reason, the source SQS `messageId`, and the domain `eventId` when available.

## Acceptance Criteria

- Valid persisted records are omitted from `batchItemFailures`.
- Duplicate events are treated as successful no-ops and omitted from `batchItemFailures`.
- Invalid records are omitted only after quarantine publication succeeds.
- A failed quarantine publication returns the source `messageId` in `batchItemFailures`.
- Retryable persistence and unexpected processing failures return only their source `messageId` in `batchItemFailures`.
- A mixed batch does not retry successful, duplicate, or successfully quarantined sibling records.
- Structured logs include `awsRequestId`, SQS `messageId`, stage, and outcome, plus parsed event identifiers when available.
- Logs do not contain raw messages, telemetry data, coordinates, delivery details, or unsafe exception text.
- Unit tests cover all routing outcomes and mixed batches.

## Out Of Scope

- Exactly-once quarantine delivery
- Additional quarantine deduplication infrastructure
- Automatic SQS polling, visibility timing, or DLQ redrive tests
- Custom metrics, dashboards, alarms, or tracing
- Manual replay tooling

## Implementation Choices Requiring Approval

- Exact quarantine message envelope
- Sequential or bounded-concurrent record processing
- Logging implementation and safe error code names

## Verification

- `npm test -- handler`
- `npm test -- logging`

## Completion Notes

To be completed after implementation and review.
