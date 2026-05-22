export interface ChannelData {
  channel: string;       // "A" | "B" | "C"
  currentAmps: number;
  overload: boolean;
  relayActive: boolean;
}

export interface TelemetryData {
  device: string;
  uptime: number;        // seconds
  events: number;
  channels: ChannelData[];
  timestamp: Date;       // parsed from ISO string on receipt
}
