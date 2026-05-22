import fc from 'fast-check';
import { LoadBalancerModel } from '../models/LoadBalancerModel';

/**
 * Preservation Property Tests
 *
 * These tests capture the EXISTING correct behavior of the system that must
 * be preserved after the bugfix is applied. They are written BEFORE the fix
 * and must PASS on unfixed code.
 *
 * Observation-first methodology:
 * - model.updateChannel('A', 5.0) sets currentAmps to 5.0 and overload to false
 * - model.updateChannel('B', 16.0) sets currentAmps to 16.0 and overload to true, events increments
 * - model.reset() clears all channels to 0A, overload=false, relayActive=true, events=0
 * - model.getChannels() returns array of 3 ChannelData objects with correct shape
 * - model.setRelayState('A', false) sets relayActive to false and returns true
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.5
 */

describe('Preservation - Non-Overridden MQTT Updates and Reset Behavior', () => {
  /**
   * Property test 1 - MQTT update for non-overridden channels
   *
   * For non-overridden channels, model.updateChannel(channelId, current) must set
   * currentAmps = current and overload = (current > 15).
   *
   * **Validates: Requirements 3.1, 3.5**
   */
  it('should set currentAmps and overload correctly for non-overridden channel updates', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.float({ min: 0, max: 30, noNaN: true }),
        (channelId, current) => {
          const model = new LoadBalancerModel('test-device');

          // Act: simulate MQTT update on a non-overridden channel
          const result = model.updateChannel(channelId, current);

          // Assert: update succeeds
          expect(result).toBe(true);

          // Assert: currentAmps is set to the provided value
          const channel = model.getChannel(channelId);
          expect(channel!.currentAmps).toBe(current);

          // Assert: overload is true iff current > 15
          expect(channel!.overload).toBe(current > 15);
        }
      ),
      { numRuns: 200 }
    );
  });

  /**
   * Property test 2 - Reset clears all state
   *
   * After any arbitrary sequence of updateChannel and setRelayState calls,
   * calling model.reset() must return all channels to defaults:
   * currentAmps=0, overload=false, relayActive=true, and events=0.
   *
   * **Validates: Requirements 3.2**
   */
  it('should reset all state to defaults after arbitrary operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({
              type: fc.constant('update' as const),
              channelId: fc.constantFrom('A', 'B', 'C'),
              current: fc.float({ min: 0, max: 30, noNaN: true })
            }),
            fc.record({
              type: fc.constant('relay' as const),
              channelId: fc.constantFrom('A', 'B', 'C'),
              state: fc.boolean()
            })
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (operations) => {
          const model = new LoadBalancerModel('test-device');

          // Apply arbitrary sequence of operations
          for (const op of operations) {
            if (op.type === 'update') {
              model.updateChannel(op.channelId, op.current);
            } else {
              model.setRelayState(op.channelId, op.state);
            }
          }

          // Act: reset the model
          model.reset();

          // Assert: all channels return to defaults
          const channels = model.getChannels();
          for (const ch of channels) {
            expect(ch.currentAmps).toBe(0);
            expect(ch.overload).toBe(false);
            expect(ch.relayActive).toBe(true);
          }

          // Assert: events reset to 0
          const telemetry = model.getTelemetry();
          expect(telemetry.events).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test 3 - Channel listing shape
   *
   * After any sequence of updates, model.getChannels() always returns exactly
   * 3 elements with valid ChannelData shape (channel, currentAmps, overload, relayActive).
   *
   * **Validates: Requirements 3.3**
   */
  it('should always return exactly 3 channels with valid ChannelData shape', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            channelId: fc.constantFrom('A', 'B', 'C'),
            current: fc.float({ min: 0, max: 30, noNaN: true })
          }),
          { minLength: 0, maxLength: 15 }
        ),
        (updates) => {
          const model = new LoadBalancerModel('test-device');

          // Apply arbitrary sequence of updates
          for (const { channelId, current } of updates) {
            model.updateChannel(channelId, current);
          }

          // Act: get channels
          const channels = model.getChannels();

          // Assert: exactly 3 elements
          expect(channels).toHaveLength(3);

          // Assert: each element has valid ChannelData shape
          for (const ch of channels) {
            expect(ch).toHaveProperty('channel');
            expect(ch).toHaveProperty('currentAmps');
            expect(ch).toHaveProperty('overload');
            expect(ch).toHaveProperty('relayActive');

            // Assert: types are correct
            expect(typeof ch.channel).toBe('string');
            expect(typeof ch.currentAmps).toBe('number');
            expect(typeof ch.overload).toBe('boolean');
            expect(typeof ch.relayActive).toBe('boolean');

            // Assert: channel IDs are valid
            expect(['A', 'B', 'C']).toContain(ch.channel);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test 4 - Overload threshold consistency
   *
   * For any current value, overload is true iff current > 15.
   *
   * **Validates: Requirements 3.1, 3.5**
   */
  it('should set overload to true iff current > 15 for any value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.float({ min: 0, max: 30, noNaN: true }),
        (channelId, current) => {
          const model = new LoadBalancerModel('test-device');

          // Act: update channel with arbitrary current
          model.updateChannel(channelId, current);

          // Assert: overload is true iff current > 15
          const channel = model.getChannel(channelId);
          if (current > 15) {
            expect(channel!.overload).toBe(true);
          } else {
            expect(channel!.overload).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
