# Repository Guidance

## Current State

- T-001 has bootstrapped the root Node.js project and Jest unit-test setup. Telemetry behaviour, Serverless configuration, Docker configuration, integration tests, and CI are not implemented yet.
- Node.js `v20.20.2` is pinned in `.nvmrc` for Serverless Framework v3 Lambda runtime compatibility; the accepted implementation language is JavaScript, not TypeScript.
- `npm ci` installs the pinned dependencies and `npm test` runs unit tests. The integration script is a T-001 placeholder, not a working suite, and is due to be retired in T-006; README commands such as `npm run dev` and `docker compose up -d` remain unverified template content.
- Application modules belong in `src/`, unit tests in `test/unit/`, and LocalStack integration tests in `test/integration/`.
- Files under `.opencode/` configure OpenCode; any manifest or lockfile there is not the application package manifest.

## Decision And Ticket Workflow

- The 12 accepted files in `docs/adr/` are authoritative. Do not silently change or bypass them; ask the user when implementation exposes a conflict or material undecided choice.
- Work is ordered and status-tracked in `docs/tickets/README.md`. Implement only a user-approved ticket after reading it and every linked ADR.
- Only tickets directly under `docs/tickets/` are active. `docs/tickets/original-plan/` is a read-only snapshot and must not be implemented or updated.
- Present items under `Implementation Choices Requiring Approval` before editing when they affect dependencies, interfaces, scope, or implementation direction.
- Keep unit tests with the ticket that introduces the behaviour. Report changed files, verification results, assumptions, and unresolved risks after implementation.
- Do not mark a ticket `Done`; only the user accepts completed work.
- Load `.opencode/skills/telemetry-ticketing/SKILL.md` for ticket creation, implementation, or review rules.

## Architecture Gotchas

- SQS/Lambda delivery and quarantine publication are at-least-once. A source record is acknowledged only after a quarantine publish succeeds; quarantine messages can be duplicated and carry the source SQS `messageId` plus `eventId` when available.
- Return SQS partial batch failures only for retryable records. Persisted records, database duplicates, and successfully quarantined invalid records are successful outcomes.
- DynamoDB idempotency is a conditional write on primary key `eventId`; duplicate writes are successful no-ops. The GSIs are `droneId`/`timestamp` and sparse `errorIndexPk=ERROR`/`timestamp` for `WARNING` or `CRITICAL` health events.
- The LocalStack integration approach invokes the handler directly with SQS-shaped events, but automated integration tests are intentionally deferred. Do not claim the approach or implementation verifies Lambda polling, automatic invocation, visibility timing, or automatic DLQ redrive.
- Structured logs must not include raw telemetry, coordinates, delivery/customer details, or unsanitized exception messages.
