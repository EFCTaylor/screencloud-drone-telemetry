# ADR 0010: Define Infrastructure with Serverless Framework

## Status

Accepted

## Context

Local resources must be reproducible and remain aligned with the intended AWS deployment without maintaining separate manual setup commands.

## Decision

Define the Lambda, SQS queues, redrive policy, DynamoDB table, and GSIs in one `serverless.yml`. Use the LocalStack Serverless plugin to deploy that same definition into LocalStack locally. Docker Compose starts LocalStack only.

## Rationale

Serverless Framework is lightweight for a JavaScript Lambda project and avoids introducing Terraform for this time-boxed solution. One infrastructure definition prevents drift between local and intended AWS resources.

## Consequences

The repository requires Serverless Framework and the LocalStack plugin as development dependencies. The infrastructure definition remains intentionally limited to resources required by the challenge.
