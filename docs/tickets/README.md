# Implementation Tickets

This directory contains the work needed to complete the ScreenCloud Senior Backend Engineering Challenge. Each ticket describes one small piece of work. The accepted architecture decision records (ADRs) remain the source of truth for technical decisions.

The backlog was shortened after the 2026-09-08 scope review to fit the challenge's 3-4 hour guideline. The [original plan](original-plan/ARCHIVE.md) is kept only for reference and must not be implemented.

## Workflow

Tickets move through these states:

`Draft` -> `Ready` -> `In Progress` -> `Review` -> `Done`

The user approves each ticket before work starts and decides when it is done. If a ticket conflicts with an accepted technical decision, or lists an unresolved choice under `Implementation Choices Requiring Approval`, the agent must ask the user what to do before changing code.

## Backlog

| Ticket | Title | Depends On | Status |
| --- | --- | --- | --- |
| [T-001](T-001-project-bootstrap.md) | Set up the Node.js project | None | Done |
| [T-002](T-002-validation-and-transformation.md) | Parse and validate telemetry events | T-001 | Done |
| [T-003](T-003-dynamodb-persistence.md) | Save telemetry events in DynamoDB | T-001, T-002 | Done |
| [T-004](T-004-sqs-consumer-and-error-routing.md) | Process SQS messages and handle failures | T-002, T-003 | Draft |
| [T-005](T-005-serverless-and-localstack.md) | Set up AWS resources and LocalStack | T-001, T-003, T-004 | Draft |
| [T-006](T-006-integration-test-strategy.md) | Explain the LocalStack integration-test approach | T-003, T-004, T-005 | Draft |
| [T-007](T-007-documentation-and-final-review.md) | Finish the documentation and final review | T-001 through T-006 | Draft |

## Common Terms

- **ADR:** A short document that records an accepted technical decision and why it was made.
- **SQS:** The AWS message queue that receives telemetry events.
- **Lambda:** The AWS function that processes messages from the queue.
- **Quarantine queue:** A queue for invalid data that should not be processed again automatically.
- **DLQ:** A dead-letter queue for messages that still could not be handled after several retries.
- **DynamoDB:** The AWS database used to store validated telemetry events.
- **GSI:** A DynamoDB global secondary index, which provides another way to search stored events.
- **Idempotency:** Ensuring that receiving the same event more than once does not create multiple stored copies.
- **LocalStack:** A local replacement for the AWS services used by this challenge.

## Working Agreement

- Read `AGENTS.md`, the assigned ticket, and every linked ADR before making changes.
- Treat only tickets directly under `docs/tickets/` as active; `original-plan/` is read-only history.
- Implement one approved ticket at a time unless the user explicitly approves parallel work.
- Add unit tests in the same ticket that adds the behaviour.
- Prefer the smallest clear implementation that meets the acceptance criteria.
- Keep code straightforward and readable; avoid unnecessary abstractions, indirection, and cleverness that make behaviour harder to understand.
- Do not change an accepted technical decision while implementing a ticket.
- Report changed files, verification results, assumptions, and unresolved risks before requesting review.
- Do not mark a ticket `Done`; that decision belongs to the user.

## Lean Execution

Tickets remain separate so each change is easy to review. After approval, related tickets may be completed in these three groups:

- T-002, followed by T-003 and T-004
- T-005 and T-006
- T-007 final documentation and verification
