# T-008: Normalize Timestamps for DynamoDB Searches

## Status

Done

## Dependencies

- T-002
- T-003

## Related ADRs

- ADR 0007: Use DynamoDB for Event Storage
- ADR 0013: Normalize Timestamps to Canonical UTC

## Scope

Normalize each valid telemetry timestamp to canonical UTC with fixed millisecond precision before returning the storage-ready event. This ensures that the existing DynamoDB string sort keys order events chronologically when producers use different timezone offsets or fractional-second precision.

Update the directly affected event-contract and storage documentation. Record the completed correction in the staff review without changing its other findings.

## Acceptance Criteria

- Continue accepting valid ISO 8601 timestamps with timezone offsets.
- Return valid events with `timestamp` normalized using `Date#toISOString()`.
- Do not mutate the input or add a separate original-timestamp field.
- Canonical timestamp strings sort in the same order as their represented instants.
- Unit tests cover offsets, a UTC date boundary, fractional-second precision, chronological ordering, and unchanged input.
- The README explains that timestamps are normalized before storage.
- The high-severity timestamp finding in `staffreview.md` records the fix and verification result.

## Out Of Scope

- DynamoDB key-size validation
- Changes to the DynamoDB table or index definitions
- Preserving the producer's original timestamp representation
- Resolving medium or low staff-review findings
- Real AWS or automated LocalStack integration tests

## Implementation Choices Requiring Approval

- Normalize accepted timestamps with `Date#toISOString()` and store only the canonical value. Approved by the user before implementation.

## Verification

- `npm test -- telemetry`
- `npm test`

## Completion Notes

- Added ADR 0013 to record the approved canonical UTC timestamp contract.
- Validation now normalizes accepted timestamps with `Date#toISOString()` before returning the storage-ready event. Persistence and DynamoDB index definitions remain unchanged.
- Added unit coverage for timezone offsets, a UTC date boundary, fractional-second precision, chronological string ordering, and unchanged input.
- Updated the README and staff review to describe the normalized timestamp and record the high-severity finding as resolved.
- `npm test -- telemetry` and the complete `npm test` suite pass on Node.js `v20.20.2` (5 suites, 45 tests).
- `git diff --check` passes.
- Medium and low staff-review findings were not implemented. The timestamp portion of the existing key-size finding was removed because canonicalization now fixes the stored timestamp length; the unbounded `droneId` finding remains open.
- Accepted by the user on 2026-09-13.
