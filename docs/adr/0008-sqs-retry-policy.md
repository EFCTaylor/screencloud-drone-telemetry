# ADR 0008: Limit Retryable Processing to Five Attempts

## Status

Accepted

## Context

Temporary dependency and processing failures should be retried, while permanent data-quality failures are quarantined immediately.

## Decision

Configure the source SQS queue with a maximum receive count of five total processing attempts before redriving a message to the DLQ.

Set the SQS visibility timeout to at least six times the Lambda timeout, plus any configured batching window. For example, a 30-second Lambda timeout with no batching window uses a visibility timeout of at least 180 seconds.

## Rationale

A bounded retry count allows transient failures to recover without retrying indefinitely. A visibility timeout longer than Lambda execution prevents concurrent processing of the same message while a prior invocation is still running.

## Consequences

Unexpected failures, including programming defects, reach the DLQ after five attempts and require investigation. Invalid events remain governed by the separate quarantine policy in ADR 0006.
