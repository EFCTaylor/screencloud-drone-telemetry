# Repository Guidance

## Toolchain And Commands

- Run `nvm use` before project commands. `.nvmrc` pins Node.js `v20.20.2`, `package.json` pins npm `10.8.2`, and `test/unit/bootstrap.test.js` rejects other Node.js major versions.
- Install with `npm ci`; the root `package.json` and `package-lock.json` are the application manifests. Manifests under `.opencode/` only configure OpenCode.
- Run all automated tests with `npm test`. Run one file with `npx jest test/unit/telemetry.test.js --runInBand` (replace the path as needed).
- There are no lint, formatter, typecheck, codegen, CI, or automated integration-test commands, and no application build step. `test/integration/README.md` deliberately documents only a proposed approach.
- For local infrastructure, load `.env.example` with `set -a; . ./.env.example; set +a`, then run `docker compose up -d --wait` before `npx serverless deploy --stage local`. Use the root README publish command for an end-to-end check and finish with `docker compose down`.
- Focused infrastructure checks that do not exercise the pipeline are `docker compose config`, `npx serverless print --stage local`, and `npx serverless package`.

## Runtime Shape

- This is CommonJS JavaScript, not TypeScript. The deployed entrypoint is `src/handler.handler`; `src/index.js` is an empty bootstrap placeholder.
- `src/telemetry.js` parses, strips unknown fields, validates event-specific data, and canonicalizes timestamps. `src/persistence.js` performs conditional DynamoDB writes. `src/handler.js` owns SQS batch handling, quarantine publication, partial failures, and safe logs.
- AWS clients and environment values in `src/handler.js` are captured at module load. Tests that use defaults must set environment variables before requiring it; unit tests normally inject a dependency object as the third handler argument.
- `serverless.yml` is the resource source of truth for both AWS and LocalStack. `compose.yaml` starts LocalStack only; Serverless creates the Lambda, queues, table, indexes, event source, and IAM resources.

## Decision And Ticket Workflow

- The 13 accepted files in `docs/adr/` are authoritative. Do not silently change or bypass them; ask the user when implementation exposes a conflict or material undecided choice.
- Work is ordered and status-tracked in `docs/tickets/README.md`. Implement only a user-approved ticket after reading `challengedetails.txt`, the ticket, and every linked ADR.
- Only tickets directly under `docs/tickets/` are active. `docs/tickets/original-plan/` is a read-only snapshot and must not be implemented or updated.
- Present items under `Implementation Choices Requiring Approval` before editing when they affect dependencies, interfaces, scope, or implementation direction.
- Keep unit tests with the ticket that introduces the behaviour. Run its listed verification and report changed files, results, assumptions, and unresolved risks.
- Do not mark a ticket `Done`; only the user accepts completed work.
- Load `.opencode/skills/telemetry-ticketing/SKILL.md` for ticket creation, implementation, or review rules.
- Load `.opencode/skills/staff-pr-review/SKILL.md` for pull request, branch, commit-range, or pre-submission reviews.

## Architecture Gotchas

- SQS/Lambda delivery and quarantine publication are at-least-once. A source record is acknowledged only after a quarantine publish succeeds; quarantine messages can be duplicated and carry the source SQS `messageId` plus `eventId` when available.
- Return SQS partial batch failures only for retryable records. Persisted records, database duplicates, and successfully quarantined invalid records are successful outcomes.
- DynamoDB idempotency is a conditional write on primary key `eventId`; duplicate writes are successful no-ops. Timestamps are normalized to canonical UTC before storage. The GSIs are `droneId`/`timestamp` and sparse `errorIndexPk=ERROR`/`timestamp` for `WARNING` or `CRITICAL` health events.
- The proposed LocalStack integration approach would invoke the handler directly with SQS-shaped events, but automated integration tests are intentionally deferred. Do not claim that approach verifies Lambda polling, automatic invocation, visibility timing, or automatic DLQ redrive.
- Structured logs must not include raw telemetry, coordinates, delivery/customer details, or unsanitized exception messages.
