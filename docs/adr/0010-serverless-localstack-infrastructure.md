# ADR 0010: Define Infrastructure with Serverless Framework

## Status

Accepted

## Context

Local resources must be reproducible and remain aligned with the intended AWS deployment without maintaining separate manual setup commands.

## Decision

Define the Lambda, SQS queues, redrive policy, DynamoDB table, and GSIs in one `serverless.yml`. Use Serverless Framework v3 and the LocalStack Serverless plugin to deploy that same definition into LocalStack locally. Docker Compose starts LocalStack only.

Pin Node.js 20 for compatibility with the Lambda runtimes recognized by Serverless Framework v3.

## Rationale

Serverless Framework is lightweight for a JavaScript Lambda project and avoids introducing Terraform for this time-boxed solution. One infrastructure definition prevents drift between local and intended AWS resources.

Serverless Framework v4 supports newer Node.js Lambda runtimes, but requires reviewers to authenticate with a Serverless account or provide a license key. Version 3 keeps the challenge setup account-free.

## Consequences

The repository requires Serverless Framework and the LocalStack plugin as development dependencies. The infrastructure definition remains intentionally limited to resources required by the challenge.

Node.js 20 is end-of-life, and the Serverless v3/LocalStack plugin development dependency tree contains known audit findings. These are accepted challenge limitations, not production recommendations. A production implementation would use a supported Node.js runtime and current deployment tooling.
