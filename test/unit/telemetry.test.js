'use strict';

const { parseTelemetryEvent } = require('../../src/telemetry');

const envelope = {
  eventId: '123e4567-e89b-42d3-a456-426614174000',
  droneId: 'drone-123',
  timestamp: '2026-09-07T12:30:00.000Z',
};

const validEvents = [
  {
    ...envelope,
    eventType: 'LOCATION_UPDATE',
    telemetryData: { latitude: 54.5973, longitude: -5.9301 },
  },
  {
    ...envelope,
    eventType: 'BATTERY_UPDATE',
    telemetryData: { batteryLevel: 72 },
  },
  {
    ...envelope,
    eventType: 'DELIVERY_STARTED',
    telemetryData: { deliveryId: 'delivery-456' },
  },
  {
    ...envelope,
    eventType: 'DELIVERY_COMPLETED',
    telemetryData: { deliveryId: 'delivery-456' },
  },
  {
    ...envelope,
    eventType: 'HEALTH_STATUS_UPDATE',
    telemetryData: { healthStatus: 'HEALTHY' },
  },
];

describe('parseTelemetryEvent', () => {
  it.each(validEvents)('validates a $eventType event', (event) => {
    expect(parseTelemetryEvent(JSON.stringify(event))).toEqual({
      success: true,
      event,
    });
  });

  it.each([
    ['LOCATION_UPDATE', { latitude: 91, longitude: -5.9301 }],
    ['BATTERY_UPDATE', { batteryLevel: 101 }],
    ['DELIVERY_STARTED', { deliveryId: '' }],
    ['DELIVERY_COMPLETED', {}],
    ['HEALTH_STATUS_UPDATE', { healthStatus: 'UNKNOWN' }],
  ])('rejects invalid %s telemetry', (eventType, telemetryData) => {
    const result = parseTelemetryEvent(
      JSON.stringify({ ...envelope, eventType, telemetryData }),
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics).not.toHaveLength(0);
  });

  it('rejects malformed JSON as a permanent data failure', () => {
    expect(parseTelemetryEvent('{not-json')).toEqual({
      success: false,
      diagnostics: [{ path: [], rule: 'invalid_json' }],
    });
  });

  it.each([
    ['eventId', { eventId: 'not-a-uuid' }],
    ['droneId', { droneId: '' }],
    ['timestamp', { timestamp: 'not-a-timestamp' }],
    ['eventType', { eventType: 'UNKNOWN' }],
  ])('rejects an invalid %s', (field, replacement) => {
    const result = parseTelemetryEvent(
      JSON.stringify({ ...validEvents[1], ...replacement }),
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics.some(({ path }) => path.includes(field))).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = parseTelemetryEvent(
      JSON.stringify({ eventType: 'BATTERY_UPDATE', telemetryData: {} }),
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['eventId'] }),
        expect.objectContaining({ path: ['droneId'] }),
        expect.objectContaining({ path: ['timestamp'] }),
        expect.objectContaining({ path: ['telemetryData', 'batteryLevel'] }),
      ]),
    );
  });

  it('strips unknown fields without mutating the input', () => {
    const input = {
      ...validEvents[1],
      unvalidatedEnvelopeField: 'remove-me',
      telemetryData: {
        ...validEvents[1].telemetryData,
        unvalidatedTelemetryField: 'remove-me-too',
      },
    };
    const original = structuredClone(input);

    const result = parseTelemetryEvent(JSON.stringify(input));

    expect(result).toEqual({ success: true, event: validEvents[1] });
    expect(input).toEqual(original);
  });

  it.each([
    ['2026-09-13T12:00:00+10:00', '2026-09-13T02:00:00.000Z'],
    ['2026-01-01T00:30:00+01:00', '2025-12-31T23:30:00.000Z'],
    ['2026-09-13T02:00:00.1Z', '2026-09-13T02:00:00.100Z'],
  ])('normalizes %s to canonical UTC', (timestamp, expectedTimestamp) => {
    const input = { ...validEvents[1], timestamp };
    const original = structuredClone(input);

    const result = parseTelemetryEvent(JSON.stringify(input));

    expect(result).toEqual({
      success: true,
      event: { ...validEvents[1], timestamp: expectedTimestamp },
    });
    expect(input).toEqual(original);
  });

  it('makes timestamp string order match chronological order', () => {
    const earlier = parseTelemetryEvent(
      JSON.stringify({
        ...validEvents[1],
        timestamp: '2026-09-13T12:00:00+10:00',
      }),
    );
    const later = parseTelemetryEvent(
      JSON.stringify({
        ...validEvents[1],
        timestamp: '2026-09-13T03:00:00Z',
      }),
    );

    expect(earlier.success).toBe(true);
    expect(later.success).toBe(true);
    expect(earlier.event.timestamp < later.event.timestamp).toBe(true);
  });

  it('returns diagnostics without rejected telemetry values', () => {
    const rejectedBatteryLevel = 987654321;
    const result = parseTelemetryEvent(
      JSON.stringify({
        ...envelope,
        eventType: 'BATTERY_UPDATE',
        telemetryData: { batteryLevel: rejectedBatteryLevel },
      }),
    );

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.diagnostics)).not.toContain(
      String(rejectedBatteryLevel),
    );
    expect(result.diagnostics).toEqual([
      {
        path: ['telemetryData', 'batteryLevel'],
        rule: 'too_big',
      },
    ]);
  });
});
