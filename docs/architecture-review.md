# AI-Assisted Architecture Review

## Purpose

Before implementation, I used an AI assistant as an architecture reviewer rather than asking it to design the solution. I made the decisions and asked the assistant to challenge assumptions, identify missing trade-offs, and continue questioning weak or incomplete answers.

This document summarizes that discussion. It is intentionally not a verbatim transcript: the accepted decisions are recorded in the linked ADRs, while this document captures how the reasoning developed.

## Prompting Approach

The initial instruction included:

> Grill me on the architecture before I implement anything. Ask me one question at a time. Challenge my reasoning and ask follow-up questions if my answer is weak, inconsistent, over-engineered, or does not consider an important trade-off. Do not choose the architecture for me. Help me reach decisions that I understand and can defend.

The review covered input format, ingestion, language, event processing, validation, storage, failure handling, retries, idempotency, local development, infrastructure, testing, observability, security, and production-scale considerations.

## Decision Review Highlights

| Topic | Reasoning challenged | Outcome |
| --- | --- | --- |
| Event contract | A producer-generated UUID identifies an event, but does not prevent a broker or consumer from delivering that event more than once. | Use one JSON event per message and an immutable `eventId`; enforce idempotency at persistence. See [ADR 0001](adr/0001-json-single-event-messages.md) and [ADR 0005](adr/0005-database-idempotency.md). |
| Ingestion | An HTTP endpoint would couple producers to processor availability. SNS fan-out and Kafka would solve requirements not present in this challenge. | Use SQS with a Lambda batch consumer and partial batch failure reporting. See [ADR 0002](adr/0002-sqs-lambda-ingestion.md). |
| Language | TypeScript is preferred by the brief, but using an unfamiliar language would consume time without demonstrating more reliable architecture. JavaScript still requires runtime validation. | Use plain JavaScript, Node.js, Zod, and small framework-free modules. See [ADR 0003](adr/0003-javascript-node-zod.md). |
| Validation | One flexible `telemetryData` schema with many optional fields could accept semantically invalid combinations. | Use a shared envelope and event-specific schemas selected by `eventType`. See [ADR 0004](adr/0004-event-specific-validation.md). |
| DynamoDB key | A `droneId` and `timestamp#eventId` table key supports drone queries but does not enforce global uniqueness of `eventId` without another idempotency mechanism. | Use `eventId` as the table primary key and GSIs for drone history and error queries. See [ADR 0007](adr/0007-dynamodb-event-storage.md). |
| Error query | A generic error index was initially underspecified: pipeline failures and drone health errors are different data. | Index only `WARNING` and `CRITICAL` health events using a sparse `ERROR`/`timestamp` GSI. See [ADR 0007](adr/0007-dynamodb-event-storage.md). |
| Quarantine and DLQ | Letting invalid data fail repeatedly wastes retries. Publishing to quarantine is not exactly-once because the Lambda can fail after publishing but before acknowledging the source. | Route permanent data failures directly to quarantine, retry operational failures, and accept duplicate quarantine delivery with correlation identifiers. See [ADR 0006](adr/0006-quarantine-and-dlq.md). |
| Retry policy | SQS `maxReceiveCount` includes the first delivery, and the visibility timeout must exceed processing time. | Allow five total processing attempts and set visibility timeout to at least six times the Lambda timeout plus any batching window. See [ADR 0008](adr/0008-sqs-retry-policy.md). |
| Local integration tests | Full LocalStack Lambda emulation would add setup cost and could encourage overstating what the tests prove. | Use LocalStack for SQS and DynamoDB, but invoke the handler directly with SQS-shaped events. See [ADR 0009](adr/0009-localstack-integration-testing.md). |
| Infrastructure tooling | Separate local initialization scripts would duplicate the intended AWS resource definition. Serverless v4 supports newer runtimes but adds reviewer authentication requirements. | Use one Serverless v3 definition with the LocalStack plugin and accept the documented Node.js 20 challenge trade-off. See [ADR 0010](adr/0010-serverless-localstack-infrastructure.md). |
| Logging | Raw telemetry would improve immediate debugging but could expose locations and delivery information. | Use structured correlation and safe error fields without logging raw telemetry or unsafe exceptions. See [ADR 0011](adr/0011-structured-safe-logging.md). |
| Permissions | Producer and processor permissions were initially described generally rather than by responsibility. | Producers can only send to the source queue; the Lambda receives source messages, writes DynamoDB, publishes quarantine records, and writes logs. See [ADR 0012](adr/0012-least-privilege-iam.md). |

## Scope Decisions

The 3-4 hour target influenced the design throughout. I deliberately excluded Kafka, SNS fan-out, a query API, multiple schema versions, a separate idempotency store, exact-once quarantine delivery, custom metrics and paging, full Lambda runtime emulation, and production partition time-bucketing.

These are not assumed to be unnecessary in every environment. They are deferred until scale, consumer count, operational requirements, or measured failure modes justify their complexity.

## Implementation Workflow

After accepting the ADRs, I translated them into the ordered tickets in [`docs/tickets`](tickets/README.md). Agents receive ticket-scoped work, must surface material implementation choices for my approval, and cannot mark a ticket complete. The committed [telemetry ticketing skill](../.opencode/skills/telemetry-ticketing/SKILL.md) records these prompting and implementation constraints.

This keeps architectural ownership with me while using AI for challenge, implementation assistance, verification, and independent review.

## Addendum: Post-Design Scope Review

After completing T-001, I reviewed the original backlog against the challenge's 3-4 hour guideline. The original plan was valid, but it included implementation depth beyond the brief, particularly a full automated LocalStack integration suite. The brief requires unit tests for core processing and a description of the integration-testing approach; it does not require implemented integration tests or a deployed environment.

I therefore revised the active tickets on 2026-09-08. The original tickets are preserved in [`docs/tickets/original-plan`](tickets/original-plan/ARCHIVE.md) as evidence of the initial planning output.

The revised plan retains the architecture and its important reliability behaviour while simplifying implementation:

- Zod validation output becomes the storage-ready event rather than passing through a generic transformation framework.
- DynamoDB access uses a direct, small persistence module rather than a reusable repository abstraction.
- SQS records are processed sequentially so partial batch behaviour remains obvious.
- Structured logging uses a small JSON helper and built-in console output rather than a logging dependency.
- Infrastructure remains one Serverless definition and one Docker Compose file.
- Automated LocalStack integration tests are deferred; the README will document concrete scenarios and the limits of the proposed approach.
- Unit tests remain mandatory for validation, persistence outcomes, quarantine routing, and mixed-batch failure handling.

This refinement is an application of KISS and YAGNI rather than a change to the accepted event-driven architecture. Production capabilities continue to be documented instead of implemented speculatively.
