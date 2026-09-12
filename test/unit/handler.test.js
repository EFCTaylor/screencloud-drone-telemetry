"use strict";

const { handler } = require("../../src/handler");

const context = { awsRequestId: "request-123" };
const tableName = "telemetry-events";
const quarantineQueueUrl = "http://localhost:4566/quarantine";
const validEvent = {
  eventId: "123e4567-e89b-42d3-a456-426614174000",
  droneId: "drone-123",
  timestamp: "2026-09-07T12:30:00Z",
  eventType: "BATTERY_UPDATE",
  telemetryData: { batteryLevel: 72 },
};

function sqsRecord(messageId, body) {
  return { messageId, body };
}

describe("handler", () => {
  let dependencies;

  beforeEach(() => {
    dependencies = {
      documentClient: { send: jest.fn().mockResolvedValue({}) },
      sqsClient: { send: jest.fn().mockResolvedValue({}) },
      tableName,
      quarantineQueueUrl,
      writeLog: jest.fn(),
    };
  });

  it("stores a valid event without retrying it", async () => {
    const result = await handler(
      { Records: [sqsRecord("stored-message", JSON.stringify(validEvent))] },
      context,
      dependencies,
    );

    expect(result).toEqual({ batchItemFailures: [] });
    expect(dependencies.documentClient.send).toHaveBeenCalledTimes(1);
    expect(dependencies.sqsClient.send).not.toHaveBeenCalled();
    expect(dependencies.writeLog).toHaveBeenCalledWith({
      awsRequestId: context.awsRequestId,
      sqsMessageId: "stored-message",
      eventId: validEvent.eventId,
      droneId: validEvent.droneId,
      eventType: validEvent.eventType,
      stage: "persistence",
      outcome: "stored",
    });
  });

  it("acknowledges a duplicate event without retrying it", async () => {
    const duplicateError = new Error("duplicate");
    duplicateError.name = "ConditionalCheckFailedException";
    dependencies.documentClient.send.mockRejectedValue(duplicateError);

    const result = await handler(
      { Records: [sqsRecord("duplicate-message", JSON.stringify(validEvent))] },
      context,
      dependencies,
    );

    expect(result).toEqual({ batchItemFailures: [] });
    expect(dependencies.writeLog).toHaveBeenCalledWith(
      expect.objectContaining({
        sqsMessageId: "duplicate-message",
        stage: "persistence",
        outcome: "duplicate",
      }),
    );
  });

  it("publishes invalid telemetry to quarantine with safe details", async () => {
    const invalidEvent = {
      ...validEvent,
      telemetryData: { batteryLevel: 101 },
    };

    const result = await handler(
      { Records: [sqsRecord("invalid-message", JSON.stringify(invalidEvent))] },
      context,
      dependencies,
    );

    expect(result).toEqual({ batchItemFailures: [] });
    expect(dependencies.documentClient.send).not.toHaveBeenCalled();

    const command = dependencies.sqsClient.send.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe(quarantineQueueUrl);
    expect(JSON.parse(command.input.MessageBody)).toEqual({
      sourceMessageId: "invalid-message",
      eventId: validEvent.eventId,
      sourceMessage: JSON.stringify(invalidEvent),
      reason: {
        code: "INVALID_TELEMETRY",
        diagnostics: [
          { path: ["telemetryData", "batteryLevel"], rule: "too_big" },
        ],
      },
    });
  });

  it("publishes malformed JSON to quarantine without an event ID", async () => {
    const result = await handler(
      { Records: [sqsRecord("malformed-message", "{not-json")] },
      context,
      dependencies,
    );

    expect(result).toEqual({ batchItemFailures: [] });
    const quarantineMessage = JSON.parse(
      dependencies.sqsClient.send.mock.calls[0][0].input.MessageBody,
    );
    expect(quarantineMessage).toEqual({
      sourceMessageId: "malformed-message",
      sourceMessage: "{not-json",
      reason: {
        code: "INVALID_JSON",
        diagnostics: [{ path: [], rule: "invalid_json" }],
      },
    });
  });

  it("keeps a valid event ID when the event type is invalid", async () => {
    const invalidEvent = { ...validEvent, eventType: "UNKNOWN" };

    await handler(
      { Records: [sqsRecord("unknown-event", JSON.stringify(invalidEvent))] },
      context,
      dependencies,
    );

    const quarantineMessage = JSON.parse(
      dependencies.sqsClient.send.mock.calls[0][0].input.MessageBody,
    );
    expect(quarantineMessage.eventId).toBe(validEvent.eventId);
    expect(dependencies.writeLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: validEvent.eventId,
        droneId: validEvent.droneId,
        errorCode: "INVALID_TELEMETRY",
      }),
    );
    expect(dependencies.writeLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "UNKNOWN" }),
    );
  });

  it("does not use a non-string event ID as safe metadata", async () => {
    const invalidEvent = { ...validEvent, eventId: [validEvent.eventId] };

    await handler(
      { Records: [sqsRecord("invalid-event-id", JSON.stringify(invalidEvent))] },
      context,
      dependencies,
    );

    const quarantineMessage = JSON.parse(
      dependencies.sqsClient.send.mock.calls[0][0].input.MessageBody,
    );
    expect(quarantineMessage).not.toHaveProperty("eventId");
    expect(dependencies.writeLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventId: invalidEvent.eventId }),
    );
  });

  it("retries an invalid record when quarantine publication fails", async () => {
    dependencies.sqsClient.send.mockRejectedValue(
      new Error("unsafe quarantine error"),
    );

    const result = await handler(
      { Records: [sqsRecord("quarantine-failed", "{not-json")] },
      context,
      dependencies,
    );

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "quarantine-failed" }],
    });
    expect(dependencies.writeLog).toHaveBeenCalledWith({
      awsRequestId: context.awsRequestId,
      sqsMessageId: "quarantine-failed",
      stage: "quarantine",
      outcome: "failed",
      errorCode: "QUARANTINE_PUBLISH_FAILED",
    });
  });

  it("retries a valid record when persistence fails", async () => {
    dependencies.documentClient.send.mockRejectedValue(
      new Error("unsafe persistence error"),
    );

    const result = await handler(
      { Records: [sqsRecord("persistence-failed", JSON.stringify(validEvent))] },
      context,
      dependencies,
    );

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "persistence-failed" }],
    });
    expect(dependencies.writeLog).toHaveBeenCalledWith(
      expect.objectContaining({
        sqsMessageId: "persistence-failed",
        stage: "persistence",
        outcome: "failed",
        errorCode: "PERSISTENCE_FAILED",
      }),
    );
  });

  it("retries a record after an unexpected processing failure", async () => {
    const record = { messageId: "unexpected-failure" };
    Object.defineProperty(record, "body", {
      get() {
        throw new Error("unsafe processing error");
      },
    });

    const result = await handler(
      { Records: [record] },
      context,
      dependencies,
    );

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: "unexpected-failure" }],
    });
    expect(dependencies.writeLog).toHaveBeenCalledWith({
      awsRequestId: context.awsRequestId,
      sqsMessageId: "unexpected-failure",
      stage: "processing",
      outcome: "failed",
      errorCode: "UNEXPECTED_PROCESSING_FAILURE",
    });
  });

  it("returns only retryable message IDs from a mixed batch", async () => {
    const processingOrder = [];
    dependencies.documentClient.send
      .mockImplementationOnce(async () => {
        processingOrder.push("stored");
      })
      .mockImplementationOnce(async () => {
        processingOrder.push("duplicate");
        const error = new Error("duplicate");
        error.name = "ConditionalCheckFailedException";
        throw error;
      })
      .mockImplementationOnce(async () => {
        processingOrder.push("persistence-failed");
        throw new Error("database unavailable");
      });
    dependencies.sqsClient.send
      .mockImplementationOnce(async () => {
        processingOrder.push("quarantined");
      })
      .mockImplementationOnce(async () => {
        processingOrder.push("quarantine-failed");
        throw new Error("queue unavailable");
      });
    const unexpectedRecord = { messageId: "unexpected-failure" };
    Object.defineProperty(unexpectedRecord, "body", {
      get() {
        processingOrder.push("unexpected-failure");
        throw new Error("processing failed");
      },
    });

    const result = await handler(
      {
        Records: [
          sqsRecord("stored", JSON.stringify(validEvent)),
          sqsRecord("duplicate", JSON.stringify(validEvent)),
          sqsRecord("quarantined", "{not-json"),
          sqsRecord("quarantine-failed", "{also-not-json"),
          sqsRecord("persistence-failed", JSON.stringify(validEvent)),
          unexpectedRecord,
        ],
      },
      context,
      dependencies,
    );

    expect(processingOrder).toEqual([
      "stored",
      "duplicate",
      "quarantined",
      "quarantine-failed",
      "persistence-failed",
      "unexpected-failure",
    ]);
    expect(result).toEqual({
      batchItemFailures: [
        { itemIdentifier: "quarantine-failed" },
        { itemIdentifier: "persistence-failed" },
        { itemIdentifier: "unexpected-failure" },
      ],
    });
  });

  it("does not log messages, telemetry, delivery details, or exception text", async () => {
    const sensitiveEvent = {
      ...validEvent,
      eventType: "LOCATION_UPDATE",
      telemetryData: { latitude: 54.5973, longitude: -5.9301 },
    };
    dependencies.documentClient.send.mockRejectedValue(
      new Error("database failed at 54.5973"),
    );

    await handler(
      { Records: [sqsRecord("safe-log-message", JSON.stringify(sensitiveEvent))] },
      context,
      dependencies,
    );

    const invalidDeliveryEvent = {
      ...validEvent,
      eventType: "DELIVERY_COMPLETED",
      telemetryData: { deliveryId: "private-delivery-456", unexpected: true },
    };
    delete invalidDeliveryEvent.telemetryData.deliveryId;
    invalidDeliveryEvent.telemetryData.unvalidatedDeliveryDetails =
      "private-customer-details";
    dependencies.sqsClient.send.mockRejectedValue(
      new Error("quarantine failed for private-customer-details"),
    );

    await handler(
      {
        Records: [
          sqsRecord("invalid-safe-log", JSON.stringify(invalidDeliveryEvent)),
        ],
      },
      context,
      dependencies,
    );

    const logs = JSON.stringify(dependencies.writeLog.mock.calls);
    expect(logs).not.toContain("54.5973");
    expect(logs).not.toContain("-5.9301");
    expect(logs).not.toContain("database failed");
    expect(logs).not.toContain("private-customer-details");
    expect(logs).not.toContain("quarantine failed");
  });

  it("keeps processing outcomes unchanged when logging fails", async () => {
    dependencies.writeLog.mockImplementation(() => {
      throw new Error("logging unavailable");
    });

    const result = await handler(
      {
        Records: [
          sqsRecord("stored-without-log", JSON.stringify(validEvent)),
          sqsRecord("quarantined-without-log", "{not-json"),
        ],
      },
      context,
      dependencies,
    );

    expect(result).toEqual({ batchItemFailures: [] });
    expect(dependencies.documentClient.send).toHaveBeenCalledTimes(1);
    expect(dependencies.sqsClient.send).toHaveBeenCalledTimes(1);
  });
});
