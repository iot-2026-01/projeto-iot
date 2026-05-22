import { formatTimeSince } from '../utils/formatTimeSince';

interface OverloadFreeUptimeProps {
  lastOverloadAt: string | null;
}

export function OverloadFreeUptime({ lastOverloadAt }: OverloadFreeUptimeProps) {
  const label = lastOverloadAt === null
    ? 'No overloads recorded'
    : `${formatTimeSince(lastOverloadAt)} without overloads`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-muted">Uptime:</span>
      <span className="font-medium text-trading-up">{label}</span>
    </div>
  );
}
