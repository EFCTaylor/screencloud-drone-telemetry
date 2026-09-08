# T-006: Add LocalStack Integration Tests

## Status

Draft

## Dependencies

- T-003
- T-004
- T-005

## Related ADRs

- ADR 0002: Use SQS and Lambda for Ingestion
- ADR 0005: Enforce Idempotency in the Database
- ADR 0006: Separate Data Quarantine from Processing DLQ
- ADR 0007: Use DynamoDB for Event Storage
- ADR 0009: Use LocalStack for Local AWS Integration Testing
- ADR 0010: Define Infrastructure with Serverless Framework

## Scope

Add integration tests that use the Serverless-provisioned LocalStack queues and DynamoDB table. Send messages to the source queue, retrieve them, and invoke the Lambda handler directly with an SQS-shaped event.

## Acceptance Criteria

- A valid event is persisted and queryable through the drone history index.
- Delivering the same valid event twice produces one DynamoDB item.
- A `WARNING` or `CRITICAL` health event is queryable through the sparse error index.
- A non-error event does not appear in the sparse error index.
- An invalid event is published to quarantine and is not persisted.
- A quarantine record contains its source SQS `messageId` and domain `eventId` when available.
- A mixed batch response contains only retryable record identifiers.
- Setup can run repeatedly from a clean checkout without manual AWS CLI resource creation.

## Out Of Scope

- LocalStack Lambda runtime emulation
- Automatic Lambda polling and event-source mapping execution
- Real visibility timeout behaviour
- Automatic DLQ redrive verification
- Deployed AWS integration tests
- Performance or load testing

## Implementation Choices Requiring Approval

- Test isolation through resource cleanup or unique test identifiers
- Integration fixture organization

## Verification

- `docker compose up -d`
- LocalStack deployment command established by T-005
- `npm run test:integration`

## Completion Notes

To be completed after implementation and review.
