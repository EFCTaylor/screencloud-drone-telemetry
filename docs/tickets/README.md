# Implementation Tickets

This directory contains the implementation backlog for the ScreenCloud Senior Backend Engineering Challenge. Tickets translate the accepted ADRs into bounded pieces of work; they do not replace the ADRs as the architectural source of truth.

## Workflow

Tickets move through these states:

`Draft` -> `Ready` -> `In Progress` -> `Review` -> `Done`

The user approves a ticket before implementation and decides when it is done. An agent must stop for direction when a ticket exposes an architectural conflict or a material coding choice listed under `Implementation Choices Requiring Approval`.

## Backlog

| Ticket | Title | Depends On | Status |
| --- | --- | --- | --- |
| [T-001](T-001-project-bootstrap.md) | Bootstrap the Node.js project | None | Draft |
| [T-002](T-002-validation-and-transformation.md) | Validate and transform telemetry events | T-001 | Draft |
| [T-003](T-003-dynamodb-persistence.md) | Implement idempotent DynamoDB persistence | T-001, T-002 | Draft |
| [T-004](T-004-sqs-consumer-and-error-routing.md) | Implement the SQS consumer and error routing | T-002, T-003 | Draft |
| [T-005](T-005-serverless-and-localstack.md) | Define Serverless and LocalStack infrastructure | T-001, T-003, T-004 | Draft |
| [T-006](T-006-localstack-integration-tests.md) | Add LocalStack integration tests | T-003, T-004, T-005 | Draft |
| [T-007](T-007-documentation-and-final-review.md) | Complete documentation and final review | T-001 through T-006 | Draft |

## Working Agreement

- Read `AGENTS.md`, the assigned ticket, and every linked ADR before editing.
- Implement one approved ticket at a time unless the user explicitly approves parallel work.
- Keep unit tests in the ticket that introduces the behaviour.
- Prefer the smallest clear implementation that meets the acceptance criteria.
- Do not change an accepted architectural decision while implementing a ticket.
- Report changed files, verification results, assumptions, and unresolved risks before requesting review.
- Do not mark a ticket `Done`; that decision belongs to the user.
