export interface ChannelData {
  channel: string;
  currentAmps: number;
  overload: boolean;
  relayActive: boolean;
  lastOverloadAt: string | null; // ISO timestamp of last overload event, null if never overloaded
}

export interface TelemetryData {
  device: string;
  uptime: number;
  events: number;
  channels: ChannelData[];
  timestamp: Date;
}