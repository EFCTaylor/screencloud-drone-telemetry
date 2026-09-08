# ADR 0012: Apply Least-Privilege IAM Access

## Status

Accepted

## Context

Producers and the telemetry processor have different responsibilities and should not receive broad access to pipeline resources.

## Decision

Grant producers an AWS identity or service role that can send messages only to the main telemetry queue.

Grant the Lambda execution role only the permissions required to receive, delete, and inspect attributes on the main queue; publish to the quarantine queue; write telemetry to DynamoDB; and write scoped CloudWatch Logs.

## Rationale

Restricting access to the minimum required limits the blast radius of a compromised producer or processing function.

## Consequences

Producers cannot read queues, write to DynamoDB, or access the quarantine queue or DLQ. The Lambda does not need direct DLQ permissions because SQS performs redrive.
