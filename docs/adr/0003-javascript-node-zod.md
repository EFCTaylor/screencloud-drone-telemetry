# ADR 0003: Use JavaScript, Node.js, and Zod

## Status

Accepted

## Context

The challenge recommends TypeScript, but delivery time is limited and the implementation should be understandable, testable, and reliable.

## Decision

Implement the Lambda in JavaScript on Node.js and use Zod for runtime validation. Keep the Lambda handler thin and implement validation, transformation, and persistence as separate plain JavaScript functions.

## Rationale

JavaScript is the implementation language the author can use confidently within the challenge time limit. Zod provides runtime schema validation and structured validation errors without adding an application framework.

## Consequences

The solution does not use the challenge's preferred TypeScript. Tests and clear module boundaries compensate for reduced static type checking. Express and NestJS are excluded because no HTTP application is required.
