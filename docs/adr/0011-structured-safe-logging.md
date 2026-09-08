# ADR 0011: Use Structured Logging Without Raw Telemetry

## Status

Accepted

## Context

The pipeline needs diagnosable processing outcomes without exposing sensitive operational or delivery data in logs.

## Decision

Emit structured JSON logs. Every relevant log includes `awsRequestId`, `sqsMessageId`, processing `stage`, and `outcome`. Parsed events additionally include `eventId`, `droneId`, and `eventType`.

Failures include a safe error code and structured diagnostic details, such as a validation field path and failed rule or a dependency error category.

## Rationale

Consistent correlation fields make it possible to trace each record through a Lambda invocation. Structured, safe errors support investigation without recording sensitive payload values.

## Consequences

Raw `telemetryData`, exact GPS coordinates, delivery or customer details, and unsanitized exception messages must not be logged. Custom metrics and paging are outside the challenge scope.
