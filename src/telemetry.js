"use strict";

const { z } = require("zod");

const identifierSchema = z.string().min(1).regex(/\S/);

const sharedEventFields = {
  eventId: z.uuid(),
  droneId: identifierSchema,
  timestamp: z.iso.datetime({ offset: true }),
};

const telemetryEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    ...sharedEventFields,
    eventType: z.literal("LOCATION_UPDATE"),
    telemetryData: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  }),
  z.object({
    ...sharedEventFields,
    eventType: z.literal("BATTERY_UPDATE"),
    telemetryData: z.object({
      batteryLevel: z.number().min(0).max(100),
    }),
  }),
  z.object({
    ...sharedEventFields,
    eventType: z.literal("DELIVERY_STARTED"),
    telemetryData: z.object({
      deliveryId: identifierSchema,
    }),
  }),
  z.object({
    ...sharedEventFields,
    eventType: z.literal("DELIVERY_COMPLETED"),
    telemetryData: z.object({
      deliveryId: identifierSchema,
    }),
  }),
  z.object({
    ...sharedEventFields,
    eventType: z.literal("HEALTH_STATUS_UPDATE"),
    telemetryData: z.object({
      healthStatus: z.enum(["HEALTHY", "WARNING", "CRITICAL"]),
    }),
  }),
]);

function parseTelemetryEvent(messageBody) {
  let input;

  // check for valid json
  try {
    input = JSON.parse(messageBody);
  } catch {
    return {
      success: false,
      diagnostics: [{ path: [], rule: "invalid_json" }],
    };
  }

  // check the value against the schema
  const result = telemetryEventSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      diagnostics: result.error.issues.map((issue) => ({
        path: issue.path,
        rule: issue.code,
      })),
    };
  }

  return { success: true, event: result.data };
}

module.exports = { parseTelemetryEvent };
