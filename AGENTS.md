# Repository Guidance

## Current State

- This is currently a design-and-backlog scaffold: there is no application source, root package manifest or lockfile, test configuration, Serverless configuration, Docker configuration, CI workflow, or verified application command.
- Node.js `v24.20.0` is pinned in `.nvmrc`; the accepted implementation language is JavaScript, not TypeScript.
- Treat `README.md` as an unfinished template. Its bracketed sections, sample event, and commands such as `npm test`, `npm run dev`, and `docker compose up -d` are not implementation truth.
- Files under `.opencode/` configure OpenCode; any manifest or lockfile there is not the application package manifest.

## Decision And Ticket Workflow

- The 12 accepted files in `docs/adr/` are authoritative. Do not silently change or bypass them; ask the user when implementation exposes a conflict or material undecided choice.
- Work is ordered in `docs/tickets/README.md`; all tickets are currently `Draft`. Implement only a user-approved ticket after reading it and every linked ADR.
- Present items under `Implementation Choices Requiring Approval` before editing when they affect dependencies, interfaces, scope, or implementation direction.
- Keep unit tests with the ticket that introduces the behaviour. Report changed files, verification results, assumptions, and unresolved risks after implementation.
- Do not mark a ticket `Done`; only the user accepts completed work.
- Load `.opencode/skills/telemetry-ticketing/SKILL.md` for ticket creation, implementation, or review rules.

## Architecture Gotchas

- SQS/Lambda delivery and quarantine publication are at-least-once. A source record is acknowledged only after a quarantine publish succeeds; quarantine messages can be duplicated and carry the source SQS `messageId` plus `eventId` when available.
- Return SQS partial batch failures only for retryable records. Persisted records, database duplicates, and successfully quarantined invalid records are successful outcomes.
- DynamoDB idempotency is a conditional write on primary key `eventId`; duplicate writes are successful no-ops. The GSIs are `droneId`/`timestamp` and sparse `errorIndexPk=ERROR`/`timestamp` for `WARNING` or `CRITICAL` health events.
- LocalStack integration tests invoke the handler directly with SQS-shaped events. Do not claim they verify Lambda polling, automatic invocation, visibility timing, or automatic DLQ redrive.
- Structured logs must not include raw telemetry, coordinates, delivery/customer details, or unsanitized exception messages.
