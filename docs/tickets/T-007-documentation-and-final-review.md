# T-007: Finish the Documentation and Final Review

## Status

Draft

## Dependencies

- T-001
- T-002
- T-003
- T-004
- T-005
- T-006

## Related ADRs

- ADR 0001 through ADR 0012

## Scope

Replace the README template with a clear and accurate explanation of how the completed system works. Cover the event format, validation, saving events, handling failures, AWS resources, testing, security, and running the project locally. Also explain the assumptions made for this challenge, what the small challenge solution does not cover, what should improve for production, and how AI assistance was used.

Finally, compare the implementation with the challenge requirements, accepted technical decisions, and every ticket's acceptance criteria.

## Acceptance Criteria

- Run every command shown in the README and confirm that it works with the completed project.
- Provide complete steps for installing dependencies, starting LocalStack, creating local AWS resources, publishing an example message, and running unit tests.
- Ensure every example telemetry event passes the implemented validation and includes an `eventId`.
- Explain how events can be searched in DynamoDB and how duplicate events are prevented from being saved twice.
- Clearly explain the difference between invalid-data quarantine, messages being delivered more than once, retries, retrying only failed messages in a batch, and the DLQ.
- Explain why JavaScript was chosen and what is lost by not using TypeScript.
- Document the restricted AWS permissions and the proposed LocalStack integration-test approach. State its limitations and do not claim that automated integration tests exist.
- Describe future production improvements without implementing them in this challenge.
- Explain in the AI usage section that the user made the architecture decisions and approved each ticket's agent-assisted work.
- Update `AGENTS.md` with the final project structure and commands that have been confirmed to work.
- Remove every bracketed template placeholder and every statement that is not supported by the completed project or verification evidence.

## Out Of Scope

- Real AWS deployment
- CI/CD implementation
- Production operations guides
- Submission communication

## Implementation Choices Requiring Approval

- Agree on the final wording for future production improvements.
- Identify any incomplete work that must be disclosed.
- Provide the final repository URL and submission details.

## Verification

- `npm ci`
- `npm test`
- `docker compose up -d`
- LocalStack deployment command established by T-005
- Manually compare every README claim with the code and accepted ADRs.

## Completion Notes

To be completed after implementation and review.
