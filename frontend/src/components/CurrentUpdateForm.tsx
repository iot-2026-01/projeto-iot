import { useState } from 'react';
import { isValidCurrent } from '../utils/validation';

interface CurrentUpdateFormProps {
  channelId: string;
  disabled: boolean;
  onSubmit: (channelId: string, current: number) => Promise<void>;
}

export function CurrentUpdateForm({ channelId, disabled, onSubmit }: CurrentUpdateFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    // Clear error when value becomes valid
    const parsed = parseFloat(newValue);
    if (isValidCurrent(parsed)) {
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (!isValidCurrent(parsed)) {
      setError('Value must be a number between 0 and 999.99 A');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onSubmit(channelId, parsed);
    } finally {
      setPending(false);
    }
  }

  const isDisabled = disabled || pending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={`current-input-${channelId}`} className="text-sm text-text-muted">
        Set current (A)
      </label>
      <div className="flex gap-2">
        <input
          id={`current-input-${channelId}`}
          type="number"
          step="any"
          min={0}
          max={999.99}
          value={value}
          onChange={handleChange}
          disabled={isDisabled}
          placeholder="0 – 999.99"
          aria-label={`Current value for channel ${channelId}`}
          className="flex-1 bg-surface-card border border-hairline-dark rounded-lg px-3 h-10 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-info disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isDisabled}
          aria-label={`Submit current update for channel ${channelId}`}
          className="min-w-[44px] min-h-[44px] px-3 bg-brand-yellow text-on-primary text-sm font-semibold rounded-md hover:bg-brand-yellow-active disabled:bg-brand-yellow-dim disabled:text-text-muted transition-colors"
        >
          Set
        </button>
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-trading-down">
          {error}
        </p>
      )}
    </form>
  );
}
