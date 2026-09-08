---
name: telemetry-ticketing
description: Use when creating, refining, implementing, reviewing, or updating tickets for the ScreenCloud drone telemetry challenge.
---

# Telemetry Ticketing

## Purpose

Use the accepted ADRs to turn the ScreenCloud drone telemetry challenge into small, ordered, testable pieces of work. The user remains responsible for architecture and implementation direction.

## Sources Of Truth

Before creating or implementing a ticket, read:

1. `AGENTS.md`
2. `challengedetails.txt`
3. Relevant files in `docs/adr/`
4. Existing files in `docs/tickets/`, if present

Accepted ADRs are authoritative. Do not silently change, reinterpret, or work around them. If an ADR is ambiguous, inconsistent, or prevents a ticket from being completed, stop and ask the user for a decision. Propose an ADR only when the decision is significant and durable.

## Ticket Workflow

Use these states:

`Draft` -> `Ready` -> `In Progress` -> `Review` -> `Done`

Create tickets in `docs/tickets/` with a sequential identifier, concise title, dependencies, related ADRs, scope, explicit exclusions, acceptance criteria, verification commands, and completion notes.

Each ticket must be independently understandable and small enough to review in one focused pass. Keep dependent work in order. Do not assign overlapping implementation work in parallel unless the tickets have separate files and stable interfaces.

When asked to implement a ticket:

1. Read the ticket, linked ADRs, and relevant existing code.
2. Identify coding choices not settled by the ADRs.
3. Present those choices and wait for the user's direction before editing when they materially affect implementation approach, dependencies, public interfaces, or scope.
4. Implement only the approved ticket scope.
5. Run the ticket's verification commands.
6. Report changed files, results, assumptions, and unresolved risks.
7. Do not mark a ticket `Done`; the user decides whether to accept the work.

When asked to review a ticket, focus on behavioural defects, ADR violations, unnecessary complexity, missing tests, and acceptance criteria. Do not edit implementation unless the user explicitly requests fixes.

## Implementation Principles

Prefer straightforward, readable, boring code over clever or highly abstract solutions. Optimize for clarity, maintainability, and ease of explanation. Avoid unnecessary abstractions, indirection, generic frameworks, patterns, or premature extensibility unless they clearly simplify the current problem.

Follow KISS and YAGNI: implement only what the challenge requires. Document future improvements rather than building speculative functionality.

When multiple valid approaches exist, choose the simplest one that satisfies the requirements and is easy for another engineer to understand quickly.

Keep functions small and explicit, use clear names, and make control flow obvious. Do not hide important behaviour behind excessive helper layers or metaprogramming.

Before introducing a new abstraction, library, pattern, or architectural component, decide whether it reduces complexity in the current solution. If it does not, do not add it.

If the solution is about to become more sophisticated than necessary, stop and propose the simpler alternative first.

## Ticket Template

```md
# T-XXX: Concise Ticket Title

## Status

Draft

## Dependencies

- T-XXX

## Related ADRs

- ADR XXXX

## Scope

Describe the required outcome.

## Acceptance Criteria

- Observable, testable outcome.

## Out Of Scope

- Work deliberately deferred.

## Implementation Choices Requiring Approval

- Choices not decided by an ADR, or `None`.

## Verification

- Exact command or manual check.

## Completion Notes

To be completed after implementation and review.
```
