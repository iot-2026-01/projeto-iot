import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimeSince } from '../utils/formatTimeSince';

interface OverloadFreeUptimeProps {
  lastOverloadAt: string | null;
  relayActive: boolean;
}

export function OverloadFreeUptime({ lastOverloadAt, relayActive }: OverloadFreeUptimeProps) {
  const { t } = useTranslation();
  const reconnectedAtRef = useRef<string | null>(null);
  const wasDisconnectedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!relayActive) {
      // Relay just went inactive — mark as disconnected
      wasDisconnectedRef.current = true;
      reconnectedAtRef.current = null;
    } else if (wasDisconnectedRef.current) {
      // Relay just came back — record the reconnection timestamp
      reconnectedAtRef.current = new Date().toISOString();
      wasDisconnectedRef.current = false;
    }
  }, [relayActive]);

  if (!relayActive) {
    // While relay is disconnected, show a paused indicator
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">{t('uptimeFree.label')}</span>
        <span className="font-medium text-text-muted">—</span>
      </div>
    );
  }

  // Determine the effective start time for the counter:
  // - If we just reconnected and lastOverloadAt is older than the reconnection,
  //   use the reconnection time (the relay was off, so we can't count that period).
  // - Otherwise use lastOverloadAt as normal.
  let effectiveStart = lastOverloadAt;

  if (reconnectedAtRef.current && lastOverloadAt) {
    const reconnectedTime = new Date(reconnectedAtRef.current).getTime();
    const lastOverloadTime = new Date(lastOverloadAt).getTime();
    if (lastOverloadTime < reconnectedTime) {
      effectiveStart = reconnectedAtRef.current;
    }
  } else if (reconnectedAtRef.current && lastOverloadAt === null) {
    // Never had an overload, but relay reconnected — count from reconnection
    effectiveStart = reconnectedAtRef.current;
  }

  const label = effectiveStart === null
    ? t('uptimeFree.noOverloads')
    : t('uptimeFree.withoutOverloads', { time: formatTimeSince(effectiveStart) });

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-muted">{t('uptimeFree.label')}</span>
      <span className="font-medium text-trading-up">{label}</span>
    </div>
  );
}
