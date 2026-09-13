# Autonomous Drone Telemetry Pipeline

## Overview

This project processes telemetry from delivery drones. A producer sends one JSON event to an SQS queue. Lambda validates the event and saves valid data in DynamoDB.

The system also:

- Stops duplicate events from being saved twice
- Sends invalid data to a quarantine queue
- Retries temporary processing failures
- Moves messages to a dead-letter queue (DLQ) after repeated failures
- Logs useful identifiers without logging private telemetry

## How It Works

```text
Producer
   |
   v
Source SQS queue
   |
   v
Lambda processor
   |---------------- invalid data ----------------> Quarantine queue
   |---------------- retryable failure -----------> SQS retry, then DLQ
   |
   v
DynamoDB table
```

SQS keeps incoming events until they can be processed, even when the processor is temporarily unavailable. Lambda runs only when there is work and can scale with the queue. It receives up to 10 messages at a time. When the handler returns normally, only messages marked as failed are retried. SQS can still deliver any message more than once.

This design is small, but it still handles the main risks of an event-driven system: invalid input, duplicate delivery, temporary failures, and partial batch failures.

## Event Format

Each SQS message contains one JSON event. Every event must include:

- `eventId`: a producer-generated UUID
- `droneId`: a non-empty string
- `timestamp`: an ISO 8601 date and time with a timezone; it is normalized to UTC with fixed millisecond precision
- `eventType`: one of the supported event types below
- `telemetryData`: fields required by that event type

| Event type | Required telemetry data |
| --- | --- |
| `LOCATION_UPDATE` | `latitude` from -90 to 90 and `longitude` from -180 to 180 |
| `BATTERY_UPDATE` | `batteryLevel` from 0 to 100 |
| `DELIVERY_STARTED` | A non-empty `deliveryId` |
| `DELIVERY_COMPLETED` | A non-empty `deliveryId` |
| `HEALTH_STATUS_UPDATE` | `healthStatus` set to `HEALTHY`, `WARNING`, or `CRITICAL` |

Zod parses and validates each event. Unknown fields are removed, and timestamps are normalized with `Date#toISOString()` before the validated object is saved directly. For example, `2026-09-13T12:00:00+10:00` is stored as `2026-09-13T02:00:00.000Z`. A general `statusCode` was left out because each event type already has fields that describe its result more clearly.

### Example Event

```json
{
  "eventId": "3d6f0a68-7f40-4fd2-8b42-74bcfa6a4574",
  "droneId": "drone-123",
  "timestamp": "2026-09-13T12:30:00Z",
  "eventType": "BATTERY_UPDATE",
  "telemetryData": {
    "batteryLevel": 72
  }
}
```

## Storage And Searches

DynamoDB fits this event data because the required searches are known and do not need joins. It stores each event using `eventId` as its primary key. Writes use a condition that only succeeds when the `eventId` does not already exist. If SQS delivers the same event more than once, the first write is kept and later writes are treated as successful duplicates.

The table has two indexes:

- `drone-history` uses `droneId` and the normalized `timestamp`. It finds one drone's events in time order or within a time range.
- `health-errors` uses `errorIndexPk=ERROR` and the normalized `timestamp`. Only `WARNING` and `CRITICAL` health events are added to this index.

The table does not have an index for searching every event by type or searching every drone at once. Those searches would need another index or a separate reporting store.

## Failures And Retries

SQS and Lambda can deliver a message more than once. The DynamoDB condition on `eventId` makes these repeated deliveries safe.

Invalid JSON and events that fail validation are sent to the quarantine queue. A quarantine message contains the original SQS `messageId`, the `eventId` when it is valid, the original message, and safe validation details. The source message is only treated as complete after the quarantine write succeeds. If that write fails, the source message is retried.

Quarantine messages can also be delivered more than once. The source `messageId` and `eventId` can be used to find copies. The quarantine queue contains the original telemetry, so access to it should be restricted.

Temporary failures, such as a DynamoDB or quarantine queue error, are returned in Lambda's `batchItemFailures` response. Only those messages are retried. Valid events, duplicates, and events successfully sent to quarantine are not returned for retry.

The source queue allows five receive attempts. A message that still cannot be processed is moved to the DLQ. The quarantine queue is for bad data. The DLQ is for work that repeatedly failed to run.

## Logging

The processor writes JSON logs with fields such as the Lambda request ID, SQS message ID, event ID, drone ID, processing stage, outcome, and a safe error code.

Logs do not include raw telemetry, coordinates, delivery details, or exception messages. Logging failures are ignored so they cannot change whether an SQS message is retried.

## Technology Choices

### JavaScript And Node.js

The application uses JavaScript on Node.js `v20.20.2`. Although the brief prefers TypeScript, JavaScript is the language I currently work with. This kept the time-boxed work focused on the pipeline itself.

Zod provides runtime validation, but JavaScript does not provide TypeScript's compile-time checks. TypeScript would make it easier to catch incorrect field names and incompatible values before the code runs.

### AWS And LocalStack

`serverless.yml` defines the same resources for AWS and LocalStack:

- One Lambda processor with a 30-second timeout
- A source queue with four-day retention and a 180-second visibility timeout
- A quarantine queue and DLQ with 14-day retention
- A batch size of 10 with no wait to build a larger batch
- DLQ redrive after five receives
- A DynamoDB table with on-demand billing and two indexes

Resource names include the deployment stage. The local resources start with `drone-telemetry-local-`.

Using one Serverless file avoids separate local and AWS definitions getting out of step. Docker Compose only starts LocalStack; Serverless creates the resources inside it.

Serverless Framework v3 is used so reviewers do not need a Serverless account or licence key. It supports Node.js 20 for Lambda, so this repository pins Node.js `v20.20.2`. Node.js 20 is end-of-life, and this challenge-only toolchain has known dependency audit findings. A production project should use a supported runtime and current deployment tools.

## Security

The Lambda role can only:

- Read and delete messages from the source queue, and inspect its attributes
- Send messages to the quarantine queue
- Write to the telemetry table
- Write to its own CloudWatch log group

A separate producer policy can only send messages to the source queue. It cannot read queues or use DynamoDB. The policy is defined by Serverless but would need to be attached to the correct producer identity in a real deployment.

## Running Locally

### Prerequisites

- Node.js `v20.20.2`
- npm `10.8.2`
- Docker with Docker Compose
- nvm, or another way to select the required Node.js version

### Install The Project

```bash
git clone https://github.com/EFCTaylor/screencloud-drone-telemetry.git
cd screencloud-drone-telemetry
nvm use
npm ci
```

Load the local AWS settings into the current shell:

```bash
set -a
. ./.env.example
set +a
```

### Start The Application

Start LocalStack and wait until it is healthy:

```bash
docker compose up -d --wait
```

Create the queues, Lambda, DynamoDB table, indexes, and permissions:

```bash
npx serverless deploy --stage local
```

The deployment enables the SQS trigger, so there is no separate development server to start.

### Publish An Example Event

Run this from the repository root after loading the local AWS settings:

```bash
node <<'NODE'
const { randomUUID } = require("node:crypto");
const {
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient,
} = require("@aws-sdk/client-sqs");

const client = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
});

async function publish() {
  const { QueueUrl } = await client.send(
    new GetQueueUrlCommand({ QueueName: "drone-telemetry-local-source" }),
  );
  const event = {
    eventId: randomUUID(),
    droneId: "drone-123",
    timestamp: new Date().toISOString(),
    eventType: "BATTERY_UPDATE",
    telemetryData: { batteryLevel: 72 },
  };
  const { MessageId } = await client.send(
    new SendMessageCommand({
      QueueUrl,
      MessageBody: JSON.stringify(event),
    }),
  );

  console.log(JSON.stringify({ MessageId, event }, null, 2));
}

publish().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
NODE
```

Lambda will read the message and save the event in DynamoDB.

### Run Unit Tests

```bash
npm test
```

### Stop The Application

Stop LocalStack and remove its local resources:

```bash
docker compose down
```

## Testing

Jest unit tests check validation, transformation, DynamoDB writes, duplicate handling, quarantine messages, retries, mixed batches, and safe logging. AWS client calls are mocked so unit tests do not need LocalStack.

### Proposed LocalStack Integration Tests

Automated integration tests were not added or run as part of this challenge. If they were added, they would use the same queues and table defined in `serverless.yml`. There would be no separate test infrastructure.

The test setup would:

1. Start LocalStack and deploy the `local` stage.
2. Pause the automatic SQS trigger so Lambda cannot take messages before the tests receive them.
3. Set the local environment variables before loading `src/handler.js`.
4. Send messages to the source queue, read them back, shape them like a Lambda SQS event, and call the handler directly.

The proposed tests would check:

- Saving and finding a valid event through `drone-history`
- Receiving the same event twice without saving it twice
- Sending invalid data to quarantine
- Finding warning and critical events through `health-errors`
- Processing valid, duplicate, invalid, and retryable records in one batch

The tests would run one at a time. Each test would use its own IDs and timestamps, clear its data before and after it runs, and retry checks briefly when LocalStack needs time to return a result.

Calling the handler directly has limits. It does not test Lambda reading from SQS automatically, automatic Lambda invocation, message visibility timing, source-message acknowledgement, or automatic movement to the DLQ. Those behaviours need tests against a deployed AWS setup.

## Assumptions And Limits

- Each SQS message contains one JSON event rather than a file or a list of events.
- The producer creates a stable UUID for `eventId` and does not reuse it for different events.
- Messages remain comfortably below the SQS message-size limit.
- A general `statusCode` is not needed because validation is specific to each event type.
- LocalStack was used to check the infrastructure. The project was not deployed to a real AWS account.
- Automated LocalStack integration tests were planned but not built because the challenge prioritised core logic and a clear test approach.

## Production Improvements

For production, I would use a supported Node.js runtime and current deployment tools. I would also add CI/CD, monitoring and alarms, real AWS integration and load tests, schema versioning, data retention and replay tools, and a plan for scaling the shared health-error index. Producer identities would be created and linked to the restricted producer policy.

## AI Usage

AI tools helped explore options, review decisions, check tests and edge cases, and improve documentation. I made the architecture decisions, reviewed the generated work, and approved each ticket before it was accepted. The repository includes a reusable [staff PR review skill](.opencode/skills/staff-pr-review/SKILL.md) that defines a plain-language review process for correctness, clean code, architecture, scaling, performance, and event-driven systems.
