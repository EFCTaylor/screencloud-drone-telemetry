# ADR 0007: Use DynamoDB for Event Storage

## Status

Accepted

## Context

The pipeline must persist events idempotently and efficiently support queries for one drone's chronological telemetry history and operational-error events within a time window.

## Decision

Use DynamoDB with `eventId` as the table primary key. Write records using a conditional expression so an existing `eventId` cannot be overwritten.

Define two global secondary indexes:

- Drone history index: `droneId` partition key and `timestamp` sort key.
- Sparse error index: `errorIndexPk` partition key with the fixed value `ERROR`, and `timestamp` sort key.

Only `HEALTH_STATUS_UPDATE` events with `WARNING` or `CRITICAL` health status include `errorIndexPk`, so non-error telemetry does not appear in the error index.

## Rationale

DynamoDB fits the event-oriented workload and known access patterns without introducing relational joins. A primary key of `eventId` provides a simple global idempotency constraint. The GSIs provide the required query patterns without table scans.

## Consequences

The fixed `ERROR` partition is acceptable at challenge scale but could become a hot partition at high error volume. Time-bucketing is a future production consideration.
