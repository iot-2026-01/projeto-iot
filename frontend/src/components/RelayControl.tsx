import { useState } from 'react';

interface RelayControlProps {
  channelId: string;
  relayActive: boolean;
  disabled: boolean;
  onToggle: (channelId: string, newState: boolean) => Promise<void>;
}

export function RelayControl({ channelId, relayActive, disabled, onToggle }: RelayControlProps) {
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending || disabled) return;
    setPending(true);
    try {
      await onToggle(channelId, !relayActive);
    } finally {
      setPending(false);
    }
  };

  const isDisabled = disabled || pending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`Relay ${channelId}: ${relayActive ? 'Connected' : 'Disconnected'}`}
      className={[
        'min-h-[44px] min-w-[44px] px-4 py-2 rounded-sm text-sm font-semibold transition-colors',
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : '',
        relayActive
          ? 'bg-trading-up text-white hover:opacity-90'
          : 'bg-surface-card text-text-body border border-hairline-dark hover:bg-surface-elevated',
      ].join(' ')}
    >
      {pending ? '...' : relayActive ? 'Connected' : 'Disconnected'}
    </button>
  );
}
