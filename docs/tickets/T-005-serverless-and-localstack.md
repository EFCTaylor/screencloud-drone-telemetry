# T-005: Define Serverless and LocalStack Infrastructure

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

Define the Lambda, main telemetry queue, quarantine queue, DLQ, event-source mapping, DynamoDB table, both GSIs, redrive policy, and least-privilege Lambda permissions in one Serverless Framework configuration.

Add Docker Compose configuration that starts LocalStack. Configure the LocalStack Serverless plugin so the same resource definition can be deployed locally.

## Acceptance Criteria

- The event-source mapping enables `ReportBatchItemFailures`.
- The source queue moves a message to the DLQ after five total receives.
- The visibility timeout is at least six times the Lambda timeout plus the batching window.
- DynamoDB uses `eventId` as its primary key and defines the drone history and sparse error GSIs from ADR 0007.
- Lambda permissions are limited to source-queue consumption, quarantine publication, required DynamoDB writes, and scoped logging.
- A producer send-only IAM policy is defined or documented without granting read or database permissions.
- Docker Compose starts a healthy LocalStack container.
- Serverless can validate/package the AWS configuration and deploy the same resources to LocalStack.

## Out Of Scope

- Deployment to a real AWS account
- CI/CD
- Custom networking or multi-account design
- Dashboards, alarms, and production runbooks
- Production load or capacity testing

## Implementation Choices Requiring Approval

- Lambda timeout, batch size, and batching window
- DynamoDB billing mode
- Queue retention settings
- Exact resource names and deployment stage naming

## Verification

- `npx serverless print`
- `npx serverless package`
- `docker compose config`
- `docker compose up -d`
- LocalStack deployment command established by T-001

## Completion Notes

To be completed after implementation and review.
