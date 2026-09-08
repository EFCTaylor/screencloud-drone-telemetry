# T-006: Document the LocalStack Integration-Test Strategy

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

Document how automated integration tests would use the Serverless-provisioned LocalStack queues and DynamoDB table. The strategy sends messages to the source queue, retrieves them, and invokes the Lambda handler directly with an SQS-shaped event.

Do not implement the integration suite. Remove or clearly retire any bootstrap placeholder that suggests automated integration tests are available.

## Acceptance Criteria

- The README describes valid persistence, duplicate idempotency, invalid quarantine routing, sparse error-index querying, and mixed-batch partial failure scenarios.
- The proposed setup uses the same Serverless resources and application handler as the implementation.
- The README explains test setup, isolation, assertions, and cleanup at a practical level.
- The README states that these integration tests are proposed, not executed as part of the challenge.
- The limitations are explicit: direct handler invocation does not verify Lambda polling, automatic invocation, visibility timing, or automatic DLQ redrive.
- No documented command claims to run an integration suite that does not exist.

## Out Of Scope

- Automated LocalStack integration tests
- LocalStack Lambda runtime emulation
- Deployed AWS integration tests
- Performance or load testing

## Implementation Choices Requiring Approval

- None

## Verification

- `npm test`
- Manual cross-check of the documented strategy against ADR 0009 and the implemented infrastructure

## Completion Notes

To be completed after implementation and review.
