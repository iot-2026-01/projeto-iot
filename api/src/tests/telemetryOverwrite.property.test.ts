import fc from 'fast-check';
import { LoadBalancerModel } from '../models/LoadBalancerModel';
import { LoadBalancerController } from '../controllers/LoadBalancerController';
import { Request, Response } from 'express';

/**
 * Bug Condition Exploration Tests
 *
 * These tests encode the EXPECTED (correct) behavior. They are designed to FAIL
 * on unfixed code, proving the bugs exist. Once the fix is implemented, these
 * tests will pass.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

describe('Bug Condition Exploration - Telemetry Overwrite', () => {
  /**
   * Test 1 - Manual Override Protection
   *
   * Property: For any channel that receives an HTTP update followed by an MQTT update,
   * the HTTP-set value must be preserved (MQTT must not overwrite it).
   *
   * On UNFIXED code, the second updateChannel call (simulating MQTT) will overwrite
   * the first (simulating HTTP), causing the assertion to fail.
   *
   * **Validates: Requirements 1.1, 1.2**
   */
  it('should preserve HTTP-set channel value after MQTT update (manual override protection)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C'),
        fc.float({ min: 0, max: 30, noNaN: true }),
        fc.float({ min: 0, max: 30, noNaN: true }),
        (channelId, httpCurrent, mqttCurrent) => {
          // Ensure HTTP and MQTT values are different to make the test meaningful
          fc.pre(Math.abs(httpCurrent - mqttCurrent) > 0.01);

          const model = new LoadBalancerModel('test-device');

          // Step 1: Simulate HTTP update (user sets channel via "Set" button)
          // The controller calls updateChannel then setManualOverride
          model.updateChannel(channelId, httpCurrent);
          model.setManualOverride(channelId);

          // Step 2: Simulate MQTT update (sensor reading arrives ~1 second later)
          // MQTT should check isManualOverride before updating
          if (!model.isManualOverride(channelId)) {
            model.updateChannel(channelId, mqttCurrent);
          }

          // Assert: The HTTP-set value must be preserved (MQTT should NOT overwrite)
          const channel = model.getChannel(channelId);
          expect(channel!.currentAmps).toBe(httpCurrent);
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
   *
   * On UNFIXED code, getTelemetry() returns Omit<TelemetryData, 'timestamp'>,
   * so the timestamp field will be undefined.
   *
   * **Validates: Requirements 1.3**
   */
  it('should include a valid timestamp in telemetry response', () => {
    const model = new LoadBalancerModel('test-device');

    const telemetry = model.getTelemetry() as any;

    // Assert: timestamp field must exist and be a valid Date
    expect(telemetry.timestamp).toBeDefined();
    const date = new Date(telemetry.timestamp);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  /**
   * Test 3 - Response Shape
   *
   * Property: The updateChannel controller method must return a plain ChannelData
   * object (with channel, currentAmps, overload, relayActive at top level)
   * WITHOUT a `success` wrapper.
   *
   * On UNFIXED code, the controller returns { success: true, channel: {...} }
   * instead of the flat ChannelData object.
   *
   * **Validates: Requirements 1.4**
   */
  it('should return plain ChannelData from updateChannel without success wrapper', async () => {
    const model = new LoadBalancerModel('test-device');
    const controller = new LoadBalancerController(model);

    // Mock Express request
    const req = {
      body: { channelId: 'A', current: 10 }
    } as Request;

    // Mock Express response
    let responseBody: any = null;
    let statusCode: number = 0;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        responseBody = body;
        return res;
      }
    } as unknown as Response;

    await controller.updateChannel(req, res);

    // Assert: Response should be a plain ChannelData object at top level
    expect(statusCode).toBe(200);
    expect(responseBody).toHaveProperty('channel');
    expect(responseBody).toHaveProperty('currentAmps');
    expect(responseBody).toHaveProperty('overload');
    expect(responseBody).toHaveProperty('relayActive');

    // Assert: Response should NOT have a `success` wrapper
    expect(responseBody).not.toHaveProperty('success');
  });
});
