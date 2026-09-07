# ADR 0005: Enforce Idempotency in the Database

## Status

Accepted

## Context

SQS and Lambda processing are at-least-once. The same message can be delivered after retries, consumer failures, or acknowledgement failures.

## Decision

The persistence layer is the source of truth for idempotency. It enforces uniqueness of the producer-generated `eventId`.

## Rationale

Durable database enforcement works across Lambda restarts, concurrent processing, and multiple consumers. In-memory duplicate tracking would not.

## Consequences

A duplicate-key result is treated as a successful no-op and acknowledged, rather than retried or dead-lettered.
