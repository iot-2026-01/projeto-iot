import { ChannelData, TelemetryData } from '../types';

export class LoadBalancerModel {
  private deviceId: string;
  private channels: Map<string, ChannelData>;
  private events: number;
  private uptime: number;
  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.channels = new Map([
      ['A', { channel: 'A', currentAmps: 0, overload: false, relayActive: true, lastOverloadAt: null }],
      ['B', { channel: 'B', currentAmps: 0, overload: false, relayActive: true, lastOverloadAt: null }],
      ['C', { channel: 'C', currentAmps: 0, overload: false, relayActive: true, lastOverloadAt: null }]
    ]);
    this.events = 0;
    this.uptime = 0;
  }

  getChannels(): ChannelData[] {
    return Array.from(this.channels.values());
  }

  getChannel(id: string): ChannelData | undefined {
    return this.channels.get(id);
  }

  updateChannel(id: string, current: number): boolean {
    const channel = this.channels.get(id);
    if (!channel) return false;

    // Determine if overload condition is met (15A threshold with hysteresis)
    const overload = current > 15;
    const newOverload = overload && !channel.overload;

    // Update channel data
    channel.currentAmps = current;
    channel.overload = overload;

    // Track when overload starts
    if (newOverload) {
      channel.lastOverloadAt = new Date().toISOString();
      this.events += 1;
    }

    return true;
  }

  setRelayState(channelId: string, state: boolean): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    // Update relay state (active-low logic)
    channel.relayActive = state;
    return true;
  }

  reset(): void {
    // Reset all channels to default state
    this.channels.forEach(channel => {
      channel.currentAmps = 0;
      channel.overload = false;
      channel.relayActive = true; // Default to ON
      channel.lastOverloadAt = null;
    });

    this.events = 0;
    this.uptime = 0;
  }

  getTelemetry(): Omit<TelemetryData, 'timestamp'> & { timestamp: string } {
    return {
      device: this.deviceId,
      uptime: this.uptime,
      events: this.events,
      channels: Array.from(this.channels.values()),
      timestamp: new Date().toISOString()
    };
  }

  // Simulate uptime increment (for testing purposes)
  incrementUptime(): void {
    this.uptime += 1;
  }

  // Sync uptime from MQTT telemetry (milliseconds from ESP32)
  syncUptime(uptimeMs: number): void {
    this.uptime = Math.floor(uptimeMs / 1000);
  }

  // Sync events count from ESP32 telemetry (ESP32 is the source of truth)
  syncEvents(events: number): void {
    this.events = events;
  }

  // Update channel with explicit overload flag from ESP32 (respects hysteresis)
  updateChannelFromMqtt(id: string, current: number, overload: boolean, relay: boolean): boolean {
    const channel = this.channels.get(id);
    if (!channel) return false;

    // Track when overload starts
    if (overload && !channel.overload) {
      channel.lastOverloadAt = new Date().toISOString();
    }

    channel.currentAmps = current;
    channel.overload = overload;
    channel.relayActive = relay;

    return true;
  }
}
