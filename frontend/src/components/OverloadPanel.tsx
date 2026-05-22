import type { ChannelData } from '../types';

interface OverloadPanelProps {
  channels: ChannelData[];
}

export function OverloadPanel({ channels }: OverloadPanelProps) {
  const overloaded = channels.filter((c) => c.overload);

  return (
    <div className="bg-surface-card rounded-xl p-6">
      <h2 className="text-base font-semibold text-text-body mb-3">
        Overload Status
      </h2>

      {overloaded.length === 0 ? (
        <p className="text-sm text-text-muted">All channels normal</p>
      ) : (
        <>
          <p className="text-sm text-text-body mb-2">
            {overloaded.length} channel{overloaded.length > 1 ? 's' : ''} in overload
          </p>
          <ul className="space-y-1">
            {overloaded.map((c) => (
              <li key={c.channel} className="text-sm font-medium text-trading-down">
                Channel {c.channel}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
