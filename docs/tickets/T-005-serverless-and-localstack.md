# T-005: Set Up AWS Resources and LocalStack

## Status

Draft

## Dependencies

- T-001
- T-003
- T-004

## Related ADRs

- ADR 0002: Use SQS and Lambda for Ingestion
- ADR 0006: Separate Data Quarantine from Processing DLQ
- ADR 0007: Use DynamoDB for Event Storage
- ADR 0008: Limit Retryable Processing to Five Attempts
- ADR 0009: Use LocalStack for Local AWS Integration Testing
- ADR 0010: Define Infrastructure with Serverless Framework
- ADR 0012: Apply Least-Privilege IAM Access

## Scope

Create one Serverless Framework configuration containing only the resources this pipeline needs:

- The Lambda function that processes telemetry
- The main SQS queue that receives telemetry
- The quarantine queue for invalid messages
- The dead-letter queue (DLQ) for messages that still fail after retries
- The connection that triggers Lambda when SQS has messages
- The DynamoDB table and its two search indexes
- The rule that moves repeatedly failing messages to the DLQ
- The minimum AWS permissions needed by Lambda

Add Docker Compose configuration to start LocalStack. Configure the Serverless LocalStack plugin so the same AWS resource definitions can also be created locally.

## Acceptance Criteria

- The SQS-to-Lambda connection enables `ReportBatchItemFailures`, allowing only failed messages in a batch to be retried.
- The main queue moves a message to the DLQ after it has been received five times without being completed.
- The queue keeps a message hidden long enough for processing: its visibility timeout is at least six times the Lambda timeout, plus the maximum batching window.
- DynamoDB uses `eventId` as its unique ID and includes the two search indexes described in ADR 0007: drone history and health errors.
- Lambda can consume from the main queue, send to quarantine, write to the telemetry table, and write its own logs. It receives no broader permissions.
- Define or document a producer permission that can only send to the main queue. It cannot read messages or access DynamoDB.
- Docker Compose starts a healthy LocalStack container.
- Serverless can check and package the AWS configuration. Its local stage uses the same resource definitions with LocalStack.

## Out Of Scope

- Deployment to a real AWS account
- CI/CD
- Custom network setup or designs involving multiple AWS accounts
- Dashboards, alarms, and production runbooks
- Production load or capacity testing

## Implementation Choices Requiring Approval

- Choose the Lambda timeout, number of messages in each batch, and maximum wait for a batch.
- Choose how DynamoDB capacity is billed.
- Choose how long each queue keeps its messages.
- Choose the AWS resource names and deployment-stage names.

## Verification

- `npx serverless print`
- `npx serverless package`
- `docker compose config`
- `docker compose up -d`
- Document the LocalStack deployment command for T-006. Automated service-level tests are not part of this ticket.

## Completion Notes

To be completed after implementation and review.
