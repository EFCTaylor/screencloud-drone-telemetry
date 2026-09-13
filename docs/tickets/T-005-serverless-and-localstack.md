# T-005: Set Up AWS Resources and LocalStack

## Status

Done

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

- Lambda uses a 30-second timeout, processes up to 10 messages per batch, and does not wait to build a larger batch. The source queue uses a 180-second visibility timeout.
- DynamoDB uses on-demand `PAY_PER_REQUEST` billing.
- The source queue keeps messages for four days. The quarantine queue and DLQ keep messages for fourteen days.
- The service is named `drone-telemetry`, uses `dev` as its default stage and `local` for LocalStack, and gives every resource a stage-qualified name.
- Docker uses the pinned LocalStack community image `localstack/localstack:4.14.0`.

## Verification

- `npx serverless print`
- `npx serverless package`
- `docker compose config`
- `docker compose up -d`
- Document the LocalStack deployment command for T-006. Automated service-level tests are not part of this ticket.

## Completion Notes

- Added `serverless.yml` with the Lambda function, SQS source, quarantine and dead-letter queues, DynamoDB table and indexes, retry settings, environment variables, and stage-qualified names.
- Added a dedicated Lambda role scoped to the source queue, quarantine queue, telemetry table, and processor log group. Added a separate producer policy that can only send to the source queue.
- Added `compose.yaml` with LocalStack `4.14.0`, the required local AWS services, a health check, and Docker access required to create the Lambda.
- Updated `.env.example` to match local resource names and documented `npx serverless deploy --stage local` in `test/integration/README.md` without claiming automated integration coverage.
- `npx serverless print`, `npx serverless print --stage local`, `npx serverless package`, `docker compose config`, and the complete `npm test` suite pass on Node.js `v20.20.2` (40 tests).
- `docker compose up -d` starts a healthy LocalStack container, and `npx serverless deploy --stage local` successfully deploys stack `drone-telemetry-local` with function `drone-telemetry-local-processor`.
- Manually confirmed that the DynamoDB table is active, uses `eventId` as its primary key, uses on-demand billing, and has active `drone-history` and `health-errors` indexes with the expected keys.
- Manually confirmed that the Lambda event-source mapping is enabled with a batch size of 10, no batching delay, and `ReportBatchItemFailures`.
- Manually confirmed that the Lambda role can write only to its own logs and telemetry table, consume only from the source queue, and send only to quarantine, with no DLQ or wildcard permissions.
- Manually confirmed that the source queue has a 180-second visibility timeout, four-day retention, and a redrive policy that sends messages to the DLQ after five receives.
- Manually confirmed that the producer policy grants only `sqs:SendMessage` to the source queue.
- Accepted by the user after automated and manual verification.
