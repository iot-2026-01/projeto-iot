import fc from 'fast-check';
import { LoadBalancerModel } from '../models/LoadBalancerModel';

/**
 * Telemetry Tests
 *
 * These tests validate the telemetry model behavior after the removal of
 * the manual override / HTTP update feature. MQTT is now the sole source
 * of truth for channel data.
 */

describe('Telemetry Model', () => {
  /**
   * Test 1 - MQTT updates always apply
   *
   * Property: For any channel that receives an MQTT update, the value is always stored.
   */
  it('should always apply MQTT updates to channel data', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.float({ min: 0, max: 30, noNaN: true }),
        fc.boolean(),
        fc.boolean(),
        (channelId, current, overload, relay) => {
          const model = new LoadBalancerModel('test-device');

          model.updateChannelFromMqtt(channelId, current, overload, relay);

          const channel = model.getChannel(channelId);
          expect(channel!.currentAmps).toBe(current);
          expect(channel!.overload).toBe(overload);
          expect(channel!.relayActive).toBe(relay);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 2 - Timestamp Presence
   *
   * Property: getTelemetry() must return a response containing a `timestamp` field
   * that is a valid Date.
   */
  it('should include a valid timestamp in telemetry response', () => {
    const model = new LoadBalancerModel('test-device');

    const telemetry = model.getTelemetry() as any;

    expect(telemetry.timestamp).toBeDefined();
    const date = new Date(telemetry.timestamp);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  /**
   * Test 3 - lastOverloadAt tracking
   *
   * Property: When a channel transitions from non-overload to overload via MQTT,
   * lastOverloadAt is set to a valid ISO timestamp.
   */
  it('should set lastOverloadAt when channel enters overload via MQTT', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.float({ min: Math.fround(15.01), max: 30, noNaN: true }),
        (channelId, current) => {
          const model = new LoadBalancerModel('test-device');

          // Channel starts without overload
          expect(model.getChannel(channelId)!.lastOverloadAt).toBeNull();

          // MQTT reports overload
          model.updateChannelFromMqtt(channelId, current, true, false);

          const channel = model.getChannel(channelId);
          expect(channel!.lastOverloadAt).not.toBeNull();
          const date = new Date(channel!.lastOverloadAt!);
          expect(date.toString()).not.toBe('Invalid Date');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test 4 - lastOverloadAt preserved when already overloaded
   *
   * Property: If a channel is already in overload, subsequent MQTT updates
   * with overload=true should NOT update lastOverloadAt (it tracks the start).
   */
  it('should not update lastOverloadAt on subsequent overload MQTT messages', () => {
    const model = new LoadBalancerModel('test-device');

    // First overload
    model.updateChannelFromMqtt('A', 20, true, false);
    const firstTimestamp = model.getChannel('A')!.lastOverloadAt;

    // Small delay to ensure timestamps would differ
    model.updateChannelFromMqtt('A', 22, true, false);
    const secondTimestamp = model.getChannel('A')!.lastOverloadAt;

    expect(secondTimestamp).toBe(firstTimestamp);
  });
});
