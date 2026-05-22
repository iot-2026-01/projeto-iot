import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface ResetButtonProps {
  disabled: boolean;
  onReset: () => Promise<void>;
}

const RESET_TIMEOUT_MS = 10_000;

export function ResetButton({ disabled, onReset }: ResetButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  function handleClick() {
    setTimeoutError(null);
    setConfirmOpen(true);
  }

  function handleCancel() {
    setConfirmOpen(false);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    setPending(true);
    setTimeoutError(null);

    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      setPending(false);
      setTimeoutError('Reset timed out. Please try again.');
    }, RESET_TIMEOUT_MS);

    try {
      await onReset();
      if (!timedOut) {
        clearTimeout(timeoutId);
        setPending(false);
      }
    } catch {
      if (!timedOut) {
        clearTimeout(timeoutId);
        setPending(false);
      }
    }
  }

  const isDisabled = disabled || pending;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={pending}
        className={[
          'h-10 min-h-[44px] min-w-[44px] px-6 rounded-md',
          'text-sm font-semibold text-on-primary',
          'transition-colors',
          isDisabled
            ? 'bg-brand-yellow-dim cursor-not-allowed opacity-60'
            : 'bg-brand-yellow hover:bg-brand-yellow-active active:bg-brand-yellow-active cursor-pointer',
        ].join(' ')}
      >
        {pending ? 'Resetting…' : 'Reset System'}
      </button>

      {timeoutError !== null && (
        <p
          role="alert"
          className="mt-2 text-xs text-trading-down"
        >
          {timeoutError}
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        message="Are you sure you want to reset the system? This will clear all overload states and relay overrides."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
