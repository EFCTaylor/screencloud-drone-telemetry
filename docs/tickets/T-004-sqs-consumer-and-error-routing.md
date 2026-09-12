# T-004: Process SQS Messages and Handle Failures

## Status

Draft

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
- Tests of SQS automatically polling messages, timing message visibility, or automatically moving messages to the DLQ
- Custom metrics, dashboards, alarms, or tracing
- Manual replay tooling

## Implementation Choices Requiring Approval

- Decide the exact fields in a quarantine message.
- Decide the safe error-code names used in quarantine messages and logs.

## Verification

- `npm test -- handler`

## Completion Notes

To be completed after implementation and review.
