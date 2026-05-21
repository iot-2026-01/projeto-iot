import { LoadBalancerModel } from '../models/LoadBalancerModel';

describe('LoadBalancerModel', () => {
  let model: LoadBalancerModel;

  beforeEach(() => {
    model = new LoadBalancerModel('test-device-001');
  });

  test('should initialize with correct device ID and default channel state', () => {
    const telemetry = model.getTelemetry();
    expect(telemetry.device).toBe('test-device-001');
    expect(telemetry.channels).toHaveLength(3);
    telemetry.channels.forEach(ch => {
      expect(ch.currentAmps).toBe(0);
      expect(ch.overload).toBe(false);
      expect(ch.relayActive).toBe(true);
    });
  });

  test('should update channel current correctly', () => {
    model.updateChannel('A', 12.5);

    const channel = model.getChannel('A');
    expect(channel).toBeDefined();
    expect(channel!.currentAmps).toBe(12.5);
    expect(channel!.overload).toBe(false);
  });

  test('should detect overload when current exceeds 15A', () => {
    model.updateChannel('B', 16.0);

    const channel = model.getChannel('B');
    expect(channel).toBeDefined();
    expect(channel!.overload).toBe(true);
  });

  test('should increment event counter on new overload', () => {
    model.updateChannel('C', 18.0);
    const telemetry = model.getTelemetry();
    expect(telemetry.events).toBe(1);
  });

  test('should not double-count events for the same overload', () => {
    model.updateChannel('A', 16.0);
    model.updateChannel('A', 17.0); // still overloaded, not a new event
    const telemetry = model.getTelemetry();
    expect(telemetry.events).toBe(1);
  });

  test('should set relay state correctly', () => {
    model.setRelayState('A', false);

    const channel = model.getChannel('A');
    expect(channel).toBeDefined();
    expect(channel!.relayActive).toBe(false);
  });

  test('should reset all channels to default state', () => {
    model.updateChannel('A', 18.0);
    model.updateChannel('B', 16.0);
    model.setRelayState('C', false);
    model.reset();

    const channels = model.getChannels();
    channels.forEach(ch => {
      expect(ch.currentAmps).toBe(0);
      expect(ch.overload).toBe(false);
      expect(ch.relayActive).toBe(true);
    });
    expect(model.getTelemetry().events).toBe(0);
  });

  test('should sync uptime from MQTT telemetry', () => {
    model.syncUptime(123456);
    expect(model.getTelemetry().uptime).toBe(123456);
  });

  test('should return undefined for unknown channel', () => {
    expect(model.getChannel('Z')).toBeUndefined();
  });
});
