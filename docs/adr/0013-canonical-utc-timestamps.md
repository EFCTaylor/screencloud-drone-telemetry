# ADR 0013: Normalize Timestamps to Canonical UTC

## Status

Accepted

## Context

Telemetry timestamps may include any ISO 8601 timezone offset. DynamoDB string sort keys order those timestamp strings lexicographically, which does not produce chronological order when offsets or fractional-second precision differ.

## Decision

Continue accepting ISO 8601 timestamps with a timezone offset. During validation, normalize every valid timestamp with `Date#toISOString()` before the event is returned for storage.

The stored `timestamp` is therefore UTC with fixed millisecond precision. The original timestamp text is not stored separately.

## Rationale

Canonical UTC strings sort in chronological order in the existing DynamoDB indexes. Normalizing during validation keeps the validated event storage-ready and avoids adding another database field or persistence-specific transformation.

## Consequences

The validated event may contain different timestamp text from the producer's input while representing the same instant. For example, `2026-09-13T12:00:00+10:00` becomes `2026-09-13T02:00:00.000Z`.

The input value is not mutated. Systems that need the producer's original timestamp representation would require a separate field in a future schema change.
