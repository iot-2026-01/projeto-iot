export interface ChannelData {
  channel: string;       // "A" | "B" | "C"
  currentAmps: number;
  overload: boolean;
  relayActive: boolean;
  lastOverloadAt: string | null; // ISO timestamp of last overload event, null if never overloaded
}

export interface TelemetryData {
  device: string;
  uptime: number;        // seconds
  events: number;
  channels: ChannelData[];
  timestamp: Date;       // parsed from ISO string on receipt
}
