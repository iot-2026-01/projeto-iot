import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmation dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Semi-transparent overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div className="relative bg-surface-card rounded-xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-sm text-text-body mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm font-semibold text-text-body bg-surface-elevated hover:bg-hairline-dark transition-colors min-h-[44px] min-w-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold text-on-primary bg-brand-yellow hover:bg-brand-yellow-active transition-colors min-h-[44px] min-w-[44px]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
