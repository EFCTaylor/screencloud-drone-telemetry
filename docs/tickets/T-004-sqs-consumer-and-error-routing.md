# T-004: Process SQS Messages and Handle Failures

## Status

Review

## Dependencies

- T-002
- T-003

## Related ADRs

- ADR 0002: Use SQS and Lambda for Ingestion
- ADR 0005: Enforce Idempotency in the Database
- ADR 0006: Separate Data Quarantine from Processing DLQ
- ADR 0008: Limit Retryable Processing to Five Attempts
- ADR 0011: Use Structured Logging Without Raw Telemetry

## Scope

Create a small Lambda handler that receives a batch of messages from SQS. Process the messages one at a time and handle each message separately, so one failure does not cause successful messages to be retried. Return `batchItemFailures`, listing only the message IDs that SQS should retry.

Save valid events and treat duplicate events as successfully handled. Send broken JSON and events that fail validation to the quarantine queue. Each quarantine message contains the original SQS `sourceMessageId`, the `eventId` when it can be read safely, the original source message, and a safe reason with an error code and validation details.

Add a small local helper that writes structured JSON logs with the built-in console. Do not install a logging library.

## Acceptance Criteria

- Do not include successfully saved messages in `batchItemFailures` because they do not need another attempt.
- Treat duplicate events as successfully handled and do not retry them.
- Treat an invalid message as handled only after it has been sent successfully to the quarantine queue.
- If sending to quarantine fails, include the original `messageId` in `batchItemFailures` so SQS retries it.
- If saving an event fails with a retryable error, or processing fails unexpectedly, include only that message's `messageId` in `batchItemFailures`.
- In a mixed batch, do not retry messages that were saved, identified as duplicates, or successfully sent to quarantine.
- Structured logs include the Lambda request ID (`awsRequestId`), `sqsMessageId` copied from the SQS record's `messageId`, processing stage, and outcome. Include parsed event IDs, drone IDs, and event types when available.
- Logs do not contain raw messages, telemetry data, coordinates, delivery details, or unsafe exception text.
- Unit tests cover every success and failure route, including batches containing different outcomes.

## Out Of Scope

- Guaranteeing that a quarantine message is sent exactly once
- Extra infrastructure for preventing duplicate quarantine messages
- Handling source messages so large that wrapping the raw message and validation details would exceed the SQS message-size limit; telemetry messages are assumed to remain comfortably below that limit
- Tests of SQS automatically polling messages, timing message visibility, or automatically moving messages to the DLQ
- Custom metrics, dashboards, alarms, or tracing
- Manual replay tooling

## Implementation Choices Requiring Approval

- Quarantine messages use `{ sourceMessageId, eventId?, sourceMessage, reason: { code, diagnostics } }`.
- Quarantine messages and logs use `INVALID_JSON`, `INVALID_TELEMETRY`, `QUARANTINE_PUBLISH_FAILED`, `PERSISTENCE_FAILED`, and `UNEXPECTED_PROCESSING_FAILURE` as safe error codes.

## Verification

- `npm test -- handler`

## Completion Notes

- Added `src/handler.js` with sequential per-record processing, partial batch failures, persistence calls, quarantine publication, and structured safe logging.
- Invalid records are acknowledged only after quarantine publication succeeds. Duplicate and stored records are acknowledged, while persistence, quarantine-publication, and unexpected failures are returned for retry.
- Added unit tests for every routing outcome, mixed batches, processing order, quarantine contents, identifier correlation, logging failures, and sensitive-data protection.
- `npm test -- handler` and the complete `npm test` unit suite pass on the pinned Node.js `v20.20.2` runtime (40 tests).
- Telemetry messages are assumed to remain comfortably below the SQS message-size limit so the raw source message and validation details fit in the quarantine envelope.
