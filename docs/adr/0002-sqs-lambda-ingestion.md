# ADR 0002: Use SQS and Lambda for Ingestion

## Status

Accepted

## Context

The pipeline must process telemetry shortly after it arrives while tolerating temporary processing outages and without operating continuously when no events are available.

## Decision

Producers publish telemetry messages to Amazon SQS. An SQS-triggered AWS Lambda processes messages in batches and uses partial batch failure reporting.

## Rationale

SQS decouples producers from processing availability and provides durable buffering and retry support. Lambda scales with queue demand and does not need to run while the queue is empty. SNS fan-out and Kafka are not justified for the single-consumer, time-boxed challenge.

## Consequences

The Lambda must tolerate at-least-once delivery and batch failure semantics. Partial batch failure reporting ensures successfully processed records are not retried with failed records.
