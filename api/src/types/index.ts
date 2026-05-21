export interface ChannelData {
  channel: string;
  currentAmps: number;
  overload: boolean;
  relayActive: boolean;
}

export interface TelemetryData {
  device: string;
  uptime: number;
  events: number;
  channels: ChannelData[];
  timestamp: Date;
}