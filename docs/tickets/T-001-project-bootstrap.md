# T-001: Set Up the Node.js Project

## Status

Done

## Dependencies

- None

## Related ADRs

- ADR 0003: Use JavaScript, Node.js, and Zod
- ADR 0009: Use LocalStack for Local AWS Integration Testing
- ADR 0010: Define Infrastructure with Serverless Framework

## Scope

Set up the smallest Node.js project needed to build and test the telemetry pipeline. Add `package.json`, a lockfile, Jest configuration, simple source and test folders, and separate commands for unit and integration tests. Install the exact dependency versions required by the accepted technical decisions, but do not add telemetry behaviour or AWS resources yet.

Update `AGENTS.md` with the project structure and the commands confirmed to work during this ticket.

## Acceptance Criteria

- The required Node.js version is clearly stated and matches `.nvmrc`.
- `npm ci` installs dependencies from a committed lockfile.
- Jest runs a basic unit test without needing Docker or network access.
- Unit tests and integration tests use separate commands.
- `package.json` uses exact versions for Zod, AWS SDK v3, Serverless Framework, and the LocalStack integration packages.
- The names of settings for the AWS region, DynamoDB table, quarantine queue URL, and local AWS endpoint are documented in an example environment file or project documentation.
- Do not add an unnecessary web framework such as Express or NestJS.

## Out Of Scope

- Telemetry parsing or validation
- Lambda message-processing behaviour
- Saving events to DynamoDB
- AWS resource definitions
- CI/CD

## Implementation Choices Requiring Approval

- Choose either ECMAScript modules or CommonJS.
- Choose the exact dependency versions and Jest configuration style.
- Choose the source and test folder names.

## Verification

- `npm ci`
- `npm test`
- `npm run test:integration -- --help`

## Completion Notes

- Chose CommonJS to keep the Jest and Lambda setup simple.
- Added exact dependency versions and committed the npm lockfile.
- Pinned Node.js `v20.20.2`. Serverless Framework 3.40 does not support a newer Lambda runtime, while Serverless Framework v4 requires a login. Node.js 20 is no longer supported for production use, so this is a challenge-only compromise.
- Created `src/`, `test/unit/`, and `test/integration/`.
- Confirmed that `npm ci`, `npm test`, `npm run test:integration -- --help`, and the local Serverless command work.
- `npm audit --omit=dev` found no security issues in runtime dependencies. Development dependencies for Serverless v3 and the LocalStack plugin have 11 known audit findings and some deprecated indirect dependencies. An automatic upgrade would require the unapproved Serverless v4 and would not fix every plugin finding.
- Accepted by the user on 2026-09-08 with the documented Node.js 20 and Serverless Framework v3 trade-offs.
