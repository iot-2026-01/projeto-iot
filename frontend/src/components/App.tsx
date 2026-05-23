import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '../hooks/useTelemetry';
import { resetSystem, type ApiError } from '../api/loadBalancer';
import { ErrorBanner } from './ErrorBanner';
import { TelemetryPanel } from './TelemetryPanel';
import { OverloadPanel } from './OverloadPanel';
import { ChannelCard } from './ChannelCard';
import { ResetButton } from './ResetButton';
import { LanguageSelector } from './LanguageSelector';

const CHANNEL_IDS = ['A', 'B', 'C'] as const;

function App() {
  const { t } = useTranslation();
  const { data, loading, error, connectionUnavailable, triggerPoll } = useTelemetry();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleReset(): Promise<void> {
    try {
      await resetSystem();
      triggerPoll();
    } catch (err) {
      const apiErr = err as ApiError;
      const statusPart = apiErr.status !== undefined ? ` (${apiErr.status})` : '';
      setActionError(`Reset error:${statusPart} ${apiErr.message}`);
    }
  }

  const channels = data?.channels ?? [];

  const pollingErrorMessage = error !== null ? error.message : null;

  return (
    <div className="min-h-screen bg-canvas-dark font-sans">
      {/* Header bar */}
      <header className="bg-canvas-dark h-16 flex items-center px-4 border-b border-hairline-dark">
        <h1 className="text-brand-yellow text-lg font-semibold tracking-wide">
          {t('header.title')}
        </h1>
        <div className="ml-auto">
          <LanguageSelector />
        </div>
      </header>

      {/* Error banners */}
      <div className="px-4 pt-4 space-y-2">
        {pollingErrorMessage !== null && (
          <ErrorBanner
            message={pollingErrorMessage}
            type="polling"
          />
        )}
        {actionError !== null && (
          <ErrorBanner
            message={actionError}
            type="action"
            onDismiss={() => setActionError(null)}
          />
        )}
      </div>

      {/* Main content */}
      <main className="px-4 py-6 space-y-6">
        {/* Top panels: Telemetry + Overload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TelemetryPanel data={data} loading={loading} />
          <OverloadPanel channels={channels} />
        </div>

        {/* Channel cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHANNEL_IDS.map((id) => {
            const channelData = channels.find((c) => c.channel === id) ?? null;
            return (
              <ChannelCard
                key={id}
                channel={channelData}
              />
            );
          })}
        </div>

        {/* Reset button */}
        <div className="flex justify-start">
          <ResetButton disabled={connectionUnavailable} onReset={handleReset} />
        </div>
      </main>
    </div>
  );
}

export default App;
