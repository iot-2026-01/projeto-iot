import { useTranslation } from 'react-i18next';
import type { ChannelData } from '../types';

interface OverloadPanelProps {
  channels: ChannelData[];
}

export function OverloadPanel({ channels }: OverloadPanelProps) {
  const { t } = useTranslation();
  const overloaded = channels.filter((c) => c.overload);

  return (
    <div className="bg-surface-card rounded-xl p-6">
      <h2 className="text-base font-semibold text-text-body mb-3">
        {t('overload.title')}
      </h2>

      {overloaded.length === 0 ? (
        <p className="text-sm text-text-muted">{t('overload.allNormal')}</p>
      ) : (
        <>
          <p className="text-sm text-text-body mb-2">
            {t('overload.channelsInOverload', { count: overloaded.length })}
          </p>
          <ul className="space-y-1">
            {overloaded.map((c) => (
              <li key={c.channel} className="text-sm font-medium text-trading-down">
                {t('overload.channelLabel', { id: c.channel })}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
