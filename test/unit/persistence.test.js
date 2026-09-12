"use strict";

const { persistTelemetryEvent } = require("../../src/persistence");

const tableName = "telemetry-events";
const baseEvent = {
  eventId: "123e4567-e89b-42d3-a456-426614174000",
  droneId: "drone-123",
  timestamp: "2026-09-07T12:30:00Z",
  eventType: "BATTERY_UPDATE",
  telemetryData: { batteryLevel: 72 },
};

describe("persistTelemetryEvent", () => {
  let documentClient;

  beforeEach(() => {
    documentClient = { send: jest.fn() };
  });

  it("conditionally stores a new event", async () => {
    documentClient.send.mockResolvedValue({});

    const result = await persistTelemetryEvent({
      event: baseEvent,
      tableName,
      documentClient,
    });

    expect(result).toEqual({ status: "stored" });
    expect(documentClient.send).toHaveBeenCalledTimes(1);
    expect(documentClient.send.mock.calls[0][0].input).toEqual({
      TableName: tableName,
      Item: baseEvent,
      ConditionExpression: "attribute_not_exists(eventId)",
    });
  });

  it.each(["WARNING", "CRITICAL"])(
    "adds the sparse error index key for a %s health event",
    async (healthStatus) => {
      documentClient.send.mockResolvedValue({});
      const event = {
        ...baseEvent,
        eventType: "HEALTH_STATUS_UPDATE",
        telemetryData: { healthStatus },
      };

      await persistTelemetryEvent({ event, tableName, documentClient });

      expect(documentClient.send.mock.calls[0][0].input.Item).toEqual({
        ...event,
        errorIndexPk: "ERROR",
      });
    },
  );

  it("does not add the sparse error index key to a healthy event", async () => {
    documentClient.send.mockResolvedValue({});
    const event = {
      ...baseEvent,
      eventType: "HEALTH_STATUS_UPDATE",
      telemetryData: { healthStatus: "HEALTHY" },
    };

    await persistTelemetryEvent({ event, tableName, documentClient });

    expect(documentClient.send.mock.calls[0][0].input.Item).toEqual(event);
  });

  it("returns a successful duplicate result for an existing event", async () => {
    const error = new Error("duplicate");
    error.name = "ConditionalCheckFailedException";
    documentClient.send.mockRejectedValue(error);

    await expect(
      persistTelemetryEvent({ event: baseEvent, tableName, documentClient }),
    ).resolves.toEqual({ status: "duplicate" });
  });

  it.each([
    "ProvisionedThroughputExceededException",
    "TimeoutError",
    "AccessDeniedException",
    "InternalServerError",
  ])("allows %s to propagate for retry handling", async (errorName) => {
    const error = new Error("dependency failure");
    error.name = errorName;
    documentClient.send.mockRejectedValue(error);

    await expect(
      persistTelemetryEvent({ event: baseEvent, tableName, documentClient }),
    ).rejects.toBe(error);
  });
});
