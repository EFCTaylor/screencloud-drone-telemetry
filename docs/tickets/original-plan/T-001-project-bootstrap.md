# T-001: Bootstrap the Node.js Project

## Status

Done

## Dependencies

- None

## Related ADRs

- ADR 0003: Use JavaScript, Node.js, and Zod
- ADR 0009: Use LocalStack for Local AWS Integration Testing
- ADR 0010: Define Infrastructure with Serverless Framework

## Scope

Create the minimal Node.js project needed to implement and test the telemetry pipeline. Add a dependency manifest and lockfile, Jest configuration, a simple source and test layout, and separate scripts for unit and integration tests. Pin dependencies needed by the accepted ADRs without implementing telemetry behaviour or AWS resources.

Update `AGENTS.md` with the project structure and commands that are verified during this ticket.

## Acceptance Criteria

- The Node.js version is explicit and consistent with `.nvmrc`.
- `npm ci` installs dependencies from a committed lockfile.
- Jest can run a minimal unit test without Docker or network access.
- Unit and integration test commands are separate.
- Zod, AWS SDK v3 clients, Serverless Framework, and LocalStack integration dependencies are pinned in the manifest.
- Environment variable names for AWS region, DynamoDB table, quarantine queue URL, and local endpoint overrides are documented in an example environment file or project documentation.
- No framework such as Express or NestJS is introduced.

## Out Of Scope

- Telemetry parsing or validation
- Lambda handler behaviour
- DynamoDB persistence
- AWS resource definitions
- CI/CD

## Implementation Choices Requiring Approval

- ECMAScript modules or CommonJS
- Exact dependency versions and Jest configuration style
- Exact source and test directory names

## Verification

- `npm ci`
- `npm test`
- `npm run test:integration -- --help`

## Completion Notes

- Selected CommonJS to keep Jest and Lambda configuration straightforward.
- Added exact dependency versions and a committed npm lockfile.
- Pinned Node.js `v20.20.2` because Serverless Framework 3.40 supports Lambda runtimes only through `nodejs20.x`; this avoids Serverless Framework v4 login requirements at the cost of using an end-of-life runtime for the challenge.
- Established `src/`, `test/unit/`, and `test/integration/`.
- Verified `npm ci`, `npm test`, `npm run test:integration -- --help`, and the local Serverless executable.
- `npm audit --omit=dev` reports no runtime dependency vulnerabilities. The Serverless v3 and LocalStack plugin development dependency tree reports 11 audit findings and deprecated transitive packages; upgrading automatically would require the unapproved Serverless v4 major version and would not remove all plugin findings.
- Accepted by the user on 2026-09-08 with the documented Node.js 20 and Serverless Framework v3 trade-offs.
