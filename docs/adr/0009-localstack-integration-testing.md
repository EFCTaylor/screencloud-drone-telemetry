# ADR 0009: Use LocalStack for Local AWS Integration Testing

## Status

Accepted

## Context

The challenge requires a runnable local setup and testing of AWS service interactions without requiring a deployed AWS environment.

## Decision

Use Docker Compose to run LocalStack for SQS, the quarantine queue, the DLQ, and DynamoDB. Use Jest for unit tests of validation, transformation, and handler behaviour.

Integration tests send messages to LocalStack SQS, retrieve them, and invoke the consumer handler directly with an SQS-shaped event.

## Rationale

This verifies application behaviour against local AWS-compatible services while avoiding the complexity of emulating the Lambda runtime and SQS event-source mapping in a time-boxed challenge.

## Consequences

Integration tests verify persistence, quarantine routing, and partial batch failure responses. They do not verify SQS polling, automatic Lambda invocation, visibility timing, or automatic DLQ redrive; these require deployed AWS integration tests in production.
