# ADR 0006: Separate Data Quarantine from Processing DLQ

## Status

Accepted

## Context

The pipeline must distinguish permanent data-quality failures from temporary processing or dependency failures.

## Decision

Permanently malformed JSON and schema-invalid telemetry are explicitly published once to a quarantine queue with the raw message and structured validation failure reason. The original SQS message is then acknowledged.

Retryable processing failures are retried by SQS and sent to a dead-letter queue only after the configured maximum receive count.

## Rationale

Retrying known-invalid data is wasteful and cannot make it valid. Operational failures may recover and therefore warrant retries.

## Consequences

The Lambda requires explicit quarantine publishing logic. The quarantine queue represents data-quality failures; the dead-letter queue represents valid work that repeatedly could not be processed.
