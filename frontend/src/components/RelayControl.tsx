import { useTranslation } from 'react-i18next';

interface RelayControlProps {
  channelId: string;
  relayActive: boolean;
}

export function RelayControl({ channelId, relayActive }: RelayControlProps) {
  const { t } = useTranslation();

  const stateText = relayActive ? t('relay.connected') : t('relay.disconnected');

  return (
    <span
      role="status"
      aria-label={t('relay.ariaLabel', { channel: channelId, state: stateText })}
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold',
        relayActive
          ? 'bg-trading-up/10 text-trading-up'
          : 'bg-surface-elevated text-text-muted border border-hairline-dark',
      ].join(' ')}
    >
      <span
        className={[
          'w-2 h-2 rounded-full',
          relayActive ? 'bg-trading-up' : 'bg-text-muted',
        ].join(' ')}
      />
      {stateText}
    </span>
  );
}
