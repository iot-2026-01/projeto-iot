import { useTranslation } from 'react-i18next';
import type { TelemetryData } from '../types';
import { formatUptime } from '../utils/formatUptime';
import { formatTimestamp } from '../utils/formatTimestamp';

interface TelemetryPanelProps {
  data: TelemetryData | null;
  loading: boolean;
}

const PLACEHOLDER = '—';

export function TelemetryPanel({ data, loading }: TelemetryPanelProps) {
  const { t } = useTranslation();
  const isPlaceholder = loading && data === null;

  const deviceId = isPlaceholder ? PLACEHOLDER : (data?.device ?? PLACEHOLDER);
  const uptime = isPlaceholder ? PLACEHOLDER : (data ? formatUptime(data.uptime) : PLACEHOLDER);
  const events = isPlaceholder ? PLACEHOLDER : (data?.events?.toString() ?? PLACEHOLDER);
  const timestamp = isPlaceholder ? PLACEHOLDER : (data ? formatTimestamp(data.timestamp) : PLACEHOLDER);

  return (
    <div className="bg-surface-card rounded-xl p-6">
      <h2 className="text-base font-semibold text-text-body mb-4">{t('telemetry.title')}</h2>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {t('telemetry.deviceId')}
          </dt>
          <dd className="mt-1 text-sm text-text-body font-mono">
            {deviceId}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {t('telemetry.uptime')}
          </dt>
          <dd className="mt-1 text-sm text-text-body font-mono">
            {uptime}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {t('telemetry.events')}
          </dt>
          <dd className="mt-1 text-sm text-text-body font-mono">
            {events}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {t('telemetry.lastUpdated')}
          </dt>
          <dd className="mt-1 text-sm text-text-body font-mono">
            {timestamp}
          </dd>
        </div>
      </dl>
    </div>
  );
}
