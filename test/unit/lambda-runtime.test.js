"use strict";

const mockDocumentSend = jest.fn().mockResolvedValue({});

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(),
}));
jest.mock("@aws-sdk/client-sqs", () => ({
  SendMessageCommand: jest.fn(),
  SQSClient: jest.fn(() => ({ send: jest.fn() })),
}));
jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({ send: mockDocumentSend })),
  },
  PutCommand: jest.fn((input) => ({ input })),
}));

const { handler } = require("../../src/handler");

test("uses the default AWS clients when Lambda supplies a callback", async () => {
  const event = {
    eventId: "123e4567-e89b-42d3-a456-426614174000",
    droneId: "drone-123",
    timestamp: "2026-09-13T12:30:00Z",
    eventType: "BATTERY_UPDATE",
    telemetryData: { batteryLevel: 72 },
  };

  const result = await handler(
    {
      Records: [{ messageId: "message-123", body: JSON.stringify(event) }],
    },
    { awsRequestId: "request-123" },
    jest.fn(),
  );

  expect(result).toEqual({ batchItemFailures: [] });
  expect(mockDocumentSend).toHaveBeenCalledTimes(1);
});
