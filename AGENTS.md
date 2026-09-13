# Repository Guidance

## Current State

- T-001 through T-006 and T-008 are accepted. T-007 contains the final documentation and review work. T-008 corrected timestamp ordering found during final review.
- Node.js `v20.20.2` is pinned in `.nvmrc` for Serverless Framework v3 Lambda runtime compatibility; the implementation language is JavaScript, not TypeScript.
- `src/telemetry.js` parses and validates events, `src/persistence.js` writes them to DynamoDB, and `src/handler.js` processes SQS batches and sends invalid data to quarantine.
- `serverless.yml` defines the Lambda, queues, DynamoDB table, indexes, event-source mapping, and IAM permissions. `compose.yaml` starts LocalStack.
- Unit tests are in `test/unit/`. Automated integration tests are not implemented; `test/integration/README.md` points to the proposed approach in the root README.
- The confirmed commands are `npm ci`, `npm test`, `docker compose up -d --wait`, `npx serverless deploy --stage local`, the README example publish command, and `docker compose down`.
- Files under `.opencode/` configure OpenCode; any manifest or lockfile there is not the application package manifest.

## Decision And Ticket Workflow

- The 13 accepted files in `docs/adr/` are authoritative. Do not silently change or bypass them; ask the user when implementation exposes a conflict or material undecided choice.
- Work is ordered and status-tracked in `docs/tickets/README.md`. Implement only a user-approved ticket after reading it and every linked ADR.
- Only tickets directly under `docs/tickets/` are active. `docs/tickets/original-plan/` is a read-only snapshot and must not be implemented or updated.
- Present items under `Implementation Choices Requiring Approval` before editing when they affect dependencies, interfaces, scope, or implementation direction.
- Keep unit tests with the ticket that introduces the behaviour. Report changed files, verification results, assumptions, and unresolved risks after implementation.
- Do not mark a ticket `Done`; only the user accepts completed work.
- Load `.opencode/skills/telemetry-ticketing/SKILL.md` for ticket creation, implementation, or review rules.
- Load `.opencode/skills/staff-pr-review/SKILL.md` for pull request, branch, commit-range, or pre-submission reviews.

## Architecture Gotchas

- SQS/Lambda delivery and quarantine publication are at-least-once. A source record is acknowledged only after a quarantine publish succeeds; quarantine messages can be duplicated and carry the source SQS `messageId` plus `eventId` when available.
- Return SQS partial batch failures only for retryable records. Persisted records, database duplicates, and successfully quarantined invalid records are successful outcomes.
- DynamoDB idempotency is a conditional write on primary key `eventId`; duplicate writes are successful no-ops. Timestamps are normalized to canonical UTC before storage. The GSIs are `droneId`/`timestamp` and sparse `errorIndexPk=ERROR`/`timestamp` for `WARNING` or `CRITICAL` health events.
- The proposed LocalStack integration approach would invoke the handler directly with SQS-shaped events, but automated integration tests are intentionally deferred. Do not claim that approach verifies Lambda polling, automatic invocation, visibility timing, or automatic DLQ redrive.
- Structured logs must not include raw telemetry, coordinates, delivery/customer details, or unsanitized exception messages.
