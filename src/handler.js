"use strict";

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { persistTelemetryEvent } = require("./persistence");
const { parseTelemetryEvent } = require("./telemetry");

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const awsClientConfig = process.env.AWS_ENDPOINT_URL
  ? { endpoint: process.env.AWS_ENDPOINT_URL }
  : {};

const defaultDependencies = {
  documentClient: DynamoDBDocumentClient.from(
    new DynamoDBClient(awsClientConfig),
  ),
  sqsClient: new SQSClient(awsClientConfig),
  tableName: process.env.DYNAMODB_TABLE_NAME,
  quarantineQueueUrl: process.env.QUARANTINE_QUEUE_URL,
  writeLog: (entry) => console.log(JSON.stringify(entry)),
};

function extractValidIdentifiers(messageBody, diagnostics) {
  try {
    const input = JSON.parse(messageBody);

    return {
      ...(typeof input?.eventId === "string" &&
        uuidPattern.test(input.eventId) && { eventId: input.eventId }),
      ...(typeof input?.droneId === "string" &&
        /\S/.test(input.droneId) && { droneId: input.droneId }),
      ...(typeof input?.eventType === "string" &&
        !diagnostics.some(({ path }) => path[0] === "eventType") && {
          eventType: input.eventType,
        }),
    };
  } catch {
    return {};
  }
}

function writeSafeLog(dependencies, entry) {
  try {
    dependencies.writeLog(entry);
  } catch {
    // A logging failure must not change whether an SQS record is acknowledged.
  }
}

async function processRecord(record, awsRequestId, dependencies) {
  const logContext = {
    awsRequestId,
    sqsMessageId: record.messageId,
  };

  try {
    const validation = parseTelemetryEvent(record.body);

    if (!validation.success) {
      const errorCode = validation.diagnostics.some(
        ({ rule }) => rule === "invalid_json",
      )
        ? "INVALID_JSON"
        : "INVALID_TELEMETRY";

      const eventLogFields = extractValidIdentifiers(
        record.body,
        validation.diagnostics,
      );

      writeSafeLog(dependencies, {
        ...logContext,
        ...eventLogFields,
        stage: "validation",
        outcome: "failed",
        errorCode,
        diagnostics: validation.diagnostics,
      });

      const quarantineMessage = {
        sourceMessageId: record.messageId,
        ...(eventLogFields.eventId && { eventId: eventLogFields.eventId }),
        sourceMessage: record.body,
        reason: {
          code: errorCode,
          diagnostics: validation.diagnostics,
        },
      };

      try {
        await dependencies.sqsClient.send(
          new SendMessageCommand({
            QueueUrl: dependencies.quarantineQueueUrl,
            MessageBody: JSON.stringify(quarantineMessage),
          }),
        );

        writeSafeLog(dependencies, {
          ...logContext,
          ...eventLogFields,
          stage: "quarantine",
          outcome: "published",
        });
        return false;
      } catch {
        writeSafeLog(dependencies, {
          ...logContext,
          ...eventLogFields,
          stage: "quarantine",
          outcome: "failed",
          errorCode: "QUARANTINE_PUBLISH_FAILED",
        });
        return true;
      }
    }

    const eventLogFields = {
      eventId: validation.event.eventId,
      droneId: validation.event.droneId,
      eventType: validation.event.eventType,
    };

    try {
      const result = await persistTelemetryEvent({
        event: validation.event,
        tableName: dependencies.tableName,
        documentClient: dependencies.documentClient,
      });

      writeSafeLog(dependencies, {
        ...logContext,
        ...eventLogFields,
        stage: "persistence",
        outcome: result.status,
      });
      return false;
    } catch {
      writeSafeLog(dependencies, {
        ...logContext,
        ...eventLogFields,
        stage: "persistence",
        outcome: "failed",
        errorCode: "PERSISTENCE_FAILED",
      });
      return true;
    }
  } catch {
    writeSafeLog(dependencies, {
      ...logContext,
      stage: "processing",
      outcome: "failed",
      errorCode: "UNEXPECTED_PROCESSING_FAILURE",
    });
    return true;
  }
}

async function handler(sqsEvent, context, dependencies = defaultDependencies) {
  const batchItemFailures = [];

  for (const record of sqsEvent.Records) {
    const shouldRetry = await processRecord(
      record,
      context.awsRequestId,
      dependencies,
    );

    if (shouldRetry) {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
}

module.exports = { handler };
