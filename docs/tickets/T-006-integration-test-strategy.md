# T-006: Explain the LocalStack Integration-Test Approach

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

Explain in the README how future integration tests could use the SQS queues and DynamoDB table created in LocalStack by Serverless. The proposed tests would send messages to the main queue, read them back, and call the Lambda handler directly with data shaped like an SQS event.

Do not build these integration tests as part of this challenge. Remove or clearly label any placeholder that makes it look as though automated integration tests already exist.

## Acceptance Criteria

- The README explains how tests would check saving a valid event, handling a duplicate event, sending invalid data to quarantine, searching the health-error index, and processing a batch with mixed outcomes.
- The proposed tests use the same Serverless resources and Lambda handler as the application.
- The README explains how each test would prepare data, remain separate from other tests, check its result, and clean up afterward.
- The README clearly says that these tests are proposed and were not run as part of the challenge.
- The README clearly states the limits of this approach. Calling the handler directly does not test Lambda automatically reading SQS, automatic invocation, message visibility timing, or automatic movement to the DLQ.
- Do not document a command that claims to run an integration-test suite when none exists.

## Out Of Scope

- Automated LocalStack integration tests
- Running the Lambda runtime inside LocalStack
- Deployed AWS integration tests
- Performance or load testing

## Implementation Choices Requiring Approval

- None

## Verification

- `npm test`
- Manually compare the documented approach with ADR 0009 and the implemented AWS resources.

## Completion Notes

To be completed after implementation and review.
