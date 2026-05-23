import { useTranslation } from 'react-i18next';

interface ErrorBannerProps {
  message: string | null;
  type: 'polling' | 'action';
  onDismiss?: () => void;
}

export function ErrorBanner({ message, type, onDismiss }: ErrorBannerProps) {
  const { t } = useTranslation();

  if (message === null) {
    return null;
  }

  const displayMessage =
    type === 'polling' ? t('error.dataRefreshFailed', { message }) : message;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-surface-elevated border-l-4 border-trading-down px-4 py-3 rounded-sm"
    >
      <p className="flex-1 text-sm text-text-body">{displayMessage}</p>
      {onDismiss !== undefined && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('error.dismissAriaLabel')}
          className="shrink-0 text-text-muted hover:text-trading-down transition-colors leading-none"
        >
          ✕
        </button>
      )}
    </div>
  );
}
