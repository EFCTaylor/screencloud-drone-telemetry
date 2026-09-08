# ADR 0009: Use LocalStack for Local AWS Integration Testing

## Status

Accepted

Implementation depth was revised after acceptance; see the implementation scope addendum below.

## Context

The challenge requires a runnable local setup and testing of AWS service interactions without requiring a deployed AWS environment.

## Decision

Use Docker Compose to run LocalStack for SQS, the quarantine queue, the DLQ, and DynamoDB. Use Jest for unit tests of validation, transformation, and handler behaviour.

Integration tests send messages to LocalStack SQS, retrieve them, and invoke the consumer handler directly with an SQS-shaped event.

## Rationale

This verifies application behaviour against local AWS-compatible services while avoiding the complexity of emulating the Lambda runtime and SQS event-source mapping in a time-boxed challenge.

## Consequences

Integration tests verify persistence, quarantine routing, and partial batch failure responses. They do not verify SQS polling, automatic Lambda invocation, visibility timing, or automatic DLQ redrive; these require deployed AWS integration tests in production.

## Implementation Scope Addendum

The 2026-09-08 scope review retained LocalStack and direct handler invocation as the selected integration-testing approach, but deferred implementing the automated integration suite for this challenge. The brief requires implemented unit tests and a README description of the integration-testing strategy; automated integration tests are not required.

The README will describe the LocalStack setup, proposed test scenarios, and limitations without claiming those scenarios were executed. This reduces implementation weight while preserving a concrete, reproducible strategy for future integration testing.
