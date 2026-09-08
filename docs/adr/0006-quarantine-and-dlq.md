# ADR 0006: Separate Data Quarantine from Processing DLQ

## Status

Accepted

## Context

The pipeline must distinguish permanent data-quality failures from temporary processing or dependency failures.

## Decision

Permanently malformed JSON and schema-invalid telemetry are explicitly published to a quarantine queue with the raw message and structured validation failure reason. The original SQS message is acknowledged only after the quarantine publication succeeds.

Quarantine delivery is at-least-once. Each quarantine message includes the source SQS `messageId` and the domain `eventId` when it is available, allowing duplicate quarantine records to be identified without additional deduplication infrastructure.

Retryable processing failures are retried by SQS and sent to a dead-letter queue only after the configured maximum receive count.

## Rationale

Retrying known-invalid data is wasteful and cannot make it valid. Operational failures may recover and therefore warrant retries.

## Consequences

The Lambda requires explicit quarantine publishing logic. A failure to publish to quarantine makes the source record retryable and may eventually send it to the dead-letter queue. A Lambda failure after quarantine publication but before source-message acknowledgement can create a duplicate quarantine record. The quarantine queue represents data-quality failures; the dead-letter queue represents work that repeatedly could not be processed.
