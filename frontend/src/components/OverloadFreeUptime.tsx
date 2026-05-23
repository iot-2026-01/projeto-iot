import { useTranslation } from 'react-i18next';
import { formatTimeSince } from '../utils/formatTimeSince';

interface OverloadFreeUptimeProps {
  lastOverloadAt: string | null;
}

export function OverloadFreeUptime({ lastOverloadAt }: OverloadFreeUptimeProps) {
  const { t } = useTranslation();

  const label = lastOverloadAt === null
    ? t('uptimeFree.noOverloads')
    : t('uptimeFree.withoutOverloads', { time: formatTimeSince(lastOverloadAt) });

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-muted">{t('uptimeFree.label')}</span>
      <span className="font-medium text-trading-up">{label}</span>
    </div>
  );
}
