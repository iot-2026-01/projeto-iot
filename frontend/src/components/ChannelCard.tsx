import { useTranslation } from 'react-i18next';
import type { ChannelData } from '../types';
import { RelayControl } from './RelayControl';
import { OverloadFreeUptime } from './OverloadFreeUptime';

interface ChannelCardProps {
  channel: ChannelData | null;
  disabled: boolean;
  onRelayChange: (channelId: string, state: boolean) => Promise<void>;
}

export function ChannelCard({ channel, disabled, onRelayChange }: ChannelCardProps) {
  const { t } = useTranslation();

  if (channel === null) {
    return (
      <div className="bg-surface-card rounded-xl p-6 border-l-4 border-hairline-dark">
        <p className="text-text-muted text-sm">{t('channel.dataUnavailable')}</p>
      </div>
    );
  }

  const isOverloaded = channel.overload === true;

  return (
    <div
      data-overload={isOverloaded ? 'true' : 'false'}
      className={[
        'bg-surface-card rounded-xl p-6 border-l-4',
        isOverloaded ? 'border-trading-down' : 'border-hairline-dark',
      ].join(' ')}
    >
      {/* Header: channel identifier + overload badge */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-text-body">
          {t('channel.title', { id: channel.channel })}
        </h2>
        {isOverloaded && (
          <span className="text-xs font-medium text-trading-down uppercase tracking-wide">
            {t('channel.status.overload')}
          </span>
        )}
      </div>

      {/* Current reading */}
      <p
        className={[
          'font-mono text-4xl font-bold mb-6',
          isOverloaded ? 'text-trading-down' : 'text-trading-up',
        ].join(' ')}
      >
        {channel.currentAmps.toFixed(2)}A
      </p>

      {/* Controls and info */}
      <div className="flex flex-col gap-4">
        <RelayControl
          channelId={channel.channel}
          relayActive={channel.relayActive}
          disabled={disabled}
          onToggle={onRelayChange}
        />
        <OverloadFreeUptime lastOverloadAt={channel.lastOverloadAt} />
      </div>
    </div>
  );
}
