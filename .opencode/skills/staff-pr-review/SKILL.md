---
name: staff-pr-review
description: Use when reviewing a pull request, branch, commit range, or repository before merge or submission as a senior staff engineer.
---

# Staff PR Review

## Purpose

Review proposed changes as a senior staff or lead engineer. Find concrete problems first, then explain longer-term architecture, scaling, performance, and refactoring opportunities in plain language.

This is a review workflow, not an implementation workflow. Do not change the code under review unless the user separately asks for fixes.

## Establish The Review Scope

Before reviewing, read the repository guidance and relevant requirements, architecture decisions, tickets, and contribution documentation.

Determine the comparison range in this order:

1. Use the base branch or commit provided by the user.
2. For an identified pull request, use its base and head metadata.
3. Use the remote default branch only when it is unambiguous.
4. If no reliable base exists, ask the user rather than guessing.

Use a full-repository review only when the user explicitly requests one, such as a pre-submission review of an initial repository. Inspect any uncommitted changes and disclose whether they are included.

Review every commit in scope and the resulting state of the code. Include tests, configuration, infrastructure, migrations, dependencies, and documentation where they affect behaviour or safe operation. Run relevant non-destructive checks when practical.

## Review Priorities

Prioritise issues that can cause:

- Incorrect behaviour or data loss
- Security or privacy exposure
- Reliability, recovery, or deployment failures
- Breaking interface or data compatibility changes
- Poor scaling, uncontrolled cost, or serious performance degradation
- Tests that miss important behaviour or give false confidence
- Maintenance risk that makes future changes unsafe

Consider whether the change fits existing architecture and repository conventions. Explain the long-term consequences of important decisions, including how they affect ownership, operations, future changes, and rollback.

Do not recommend extra infrastructure, abstraction, or extensibility only because it may be useful someday. Separate current risks from future considerations, and explain what evidence or scale would justify a more complex solution.

## Clean Code

Apply clean-code principles pragmatically. Review naming, readability, control flow, function and module responsibilities, duplication, error handling, comments, and whether tests clearly describe expected behaviour.

Look for excessive abstraction, indirection, cleverness, and functions or modules that combine unrelated responsibilities. Also recognise when extracting more helpers or layers would make straightforward code harder to follow.

Do not report personal style preferences as defects. Raise a clean-code finding only when it creates a meaningful correctness, maintenance, testing, or operational risk. Keep minor suggestions from obscuring more important findings.

## Architecture And Scale

Consider the architectural impact of the change, including:

- Service and module boundaries
- API and data-model compatibility
- Dependency choices and upgrade paths
- Concurrency, resource limits, bottlenecks, and backpressure
- Availability, failure isolation, recovery, and rollback
- Observability and supportability
- Security, access control, and sensitive data
- Infrastructure cost and operational complexity

Base performance criticism on evidence when possible. When evidence is unavailable, label the concern as a hypothesis and state what should be measured before changing the design.

## Event-Driven Systems

When the system uses events, queues, streams, or asynchronous processing, also examine:

- Delivery guarantees and duplicate delivery
- Idempotency and ordering requirements
- Retry behaviour and retry exhaustion
- Poison messages, quarantine handling, and dead-letter queues
- Partial batch failures and failure isolation
- Consumer concurrency, backpressure, throughput, and hot partitions
- Event schema evolution and consumer compatibility
- Replay, retention, correlation, and operational recovery
- Logging and metrics that avoid leaking event data

Consider reasonable alternatives, but judge them against the actual requirements and expected scale. Explain why an alternative would or would not be worth its additional complexity.

## Findings

Findings are the primary output. Order them by severity and include a file and line reference whenever possible. Use these severity levels:

- **Critical:** Likely to cause severe data loss, security exposure, or system-wide failure and must be fixed before merge.
- **High:** A significant behavioural or operational defect that should be fixed before merge.
- **Medium:** A real problem with a narrower impact that should normally be addressed.
- **Low:** A small but concrete risk worth considering; do not use this for cosmetic preferences.

For each finding, explain:

1. What could go wrong
2. Where it occurs
3. Why it matters
4. What could improve it
5. Whether it must be fixed now or is a future consideration

Do not inflate severity. Do not present speculative scaling ideas as defects. If no defects are found, say so clearly and describe any remaining testing or operational uncertainty.

After the findings, use only the sections that add value:

1. **Questions And Assumptions**
2. **Architecture And Scaling**
3. **Performance And Refactoring**
4. **Verification**

## Plain Language

Write the entire review in plain, readable language. Use short, direct sentences and avoid unnecessary jargon. Expand acronyms or explain technical terms when they are needed for accuracy.

Be specific and constructive. Explain consequences instead of using vague labels such as "not clean" or "not scalable." Give practical recommendations and describe trade-offs without assuming specialist knowledge. Avoid long summaries that repeat the findings.

## Saving A Review

Return the review in the conversation by default. Create a Markdown report only when the user explicitly asks to save the findings.

When saving a report:

- Use the path supplied by the user.
- If no path is supplied, use `docs/reviews/YYYY-MM-DD-<branch>-review.md`, with a filesystem-safe branch name.
- Ask before overwriting an existing file.
- Include the review date, base and head references, scope, findings, assumptions, improvement opportunities, and verification results.
- Write the same plain-language findings provided in the conversation.
- Do not include secrets, sensitive payloads, or large copies of source code.
- Do not change the implementation while creating the report.
- Do not commit the report unless the user explicitly requests a commit.

The requested report is the only exception to the read-only review workflow.
