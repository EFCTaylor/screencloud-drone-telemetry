"use strict";

const { PutCommand } = require("@aws-sdk/lib-dynamodb");

async function persistTelemetryEvent({ event, tableName, documentClient }) {
  const isErrorHealthEvent =
    event.eventType === "HEALTH_STATUS_UPDATE" &&
    ["WARNING", "CRITICAL"].includes(event.telemetryData.healthStatus);

  const item = {
    ...event,
    ...(isErrorHealthEvent && { errorIndexPk: "ERROR" }),
  };

  try {
    await documentClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(eventId)",
      }),
    );

    return { status: "stored" };
  } catch (error) {
    if (error?.name === "ConditionalCheckFailedException") {
      return { status: "duplicate" };
    }

    throw error;
  }
}

module.exports = { persistTelemetryEvent };
