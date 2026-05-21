import mqtt, { MqttClient } from 'mqtt';
import { LoadBalancerModel } from '../models/LoadBalancerModel';

// Shape of the telemetry JSON published by the ESP32 sketch
interface MqttChannel {
  id: number;
  current_a: number;
  overload: boolean;
  relay: boolean;
}

interface EspTelemetry {
  device: string;
  uptime_ms: number;
  override: boolean;
  any_overload: boolean;
  events: number;
  redistributions: number;
  channels: MqttChannel[];
}

// Maps numeric channel id (1,2,3) to letter (A,B,C)
const CHANNEL_ID_MAP: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C' };

export class MqttSubscriberService {
  private client: MqttClient | null = null;
  private readonly broker: string;
  private readonly port: number;
  private readonly topicPrefix: string;
  private readonly deviceId: string;
  private readonly model: LoadBalancerModel;

  constructor(model: LoadBalancerModel) {
    this.model = model;
    this.broker   = process.env.MQTT_BROKER        || 'broker.hivemq.com';
    this.port     = parseInt(process.env.MQTT_PORT  || '1883', 10);
    this.topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'projeto-iot';
    this.deviceId    = process.env.DEVICE_ID         || 'balancer-01';
  }

  /** Full topic this service subscribes to, e.g. projeto-iot/balancer-01/telemetria */
  get topic(): string {
    return `${this.topicPrefix}/${this.deviceId}/telemetria`;
  }

  connect(): void {
    const url = `mqtt://${this.broker}:${this.port}`;
    console.log(`[MQTT] Connecting to ${url}, topic: ${this.topic}`);

    this.client = mqtt.connect(url, {
      clientId: `api-subscriber-${Date.now()}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      console.log('[MQTT] Connected');
      this.client!.subscribe(this.topic, { qos: 0 }, (err) => {
        if (err) {
          console.error('[MQTT] Subscribe error:', err.message);
        } else {
          console.log(`[MQTT] Subscribed to ${this.topic}`);
        }
      });
    });

    this.client.on('message', (_topic: string, payload: Buffer) => {
      this.handleMessage(payload);
    });

    this.client.on('reconnect', () => {
      console.log('[MQTT] Reconnecting...');
    });

    this.client.on('error', (err: Error) => {
      console.error('[MQTT] Error:', err.message);
    });

    this.client.on('close', () => {
      console.log('[MQTT] Connection closed');
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      console.log('[MQTT] Disconnected');
    }
  }

  private handleMessage(payload: Buffer): void {
    let data: EspTelemetry;

    try {
      data = JSON.parse(payload.toString()) as EspTelemetry;
    } catch {
      console.warn('[MQTT] Received non-JSON payload, ignoring');
      return;
    }

    // Ignore the online status message published on connect
    if (!data.channels || !Array.isArray(data.channels)) return;

    for (const ch of data.channels) {
      const channelId = CHANNEL_ID_MAP[ch.id];
      if (!channelId) {
        console.warn(`[MQTT] Unknown channel id: ${ch.id}`);
        continue;
      }

      this.model.updateChannel(channelId, ch.current_a);
      this.model.setRelayState(channelId, ch.relay);
    }

    // Keep uptime in sync
    this.model.syncUptime(data.uptime_ms);

    console.log(
      `[MQTT] Telemetry from ${data.device} | ` +
      data.channels
        .map(c => `ch${c.id}=${c.current_a.toFixed(2)}A`)
        .join(' ')
    );
  }
}
