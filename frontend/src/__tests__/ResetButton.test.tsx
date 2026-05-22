import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResetButton } from '../components/ResetButton';

// ConfirmDialog renders via ReactDOM.createPortal into document.body — RTL
// queries work across portals by default, so no special setup is needed.

function setup(onReset = vi.fn().mockResolvedValue(undefined)) {
  const utils = render(
    <ResetButton disabled={false} onReset={onReset} />
  );
  const button = screen.getByRole('button', { name: /reset system/i });
  return { ...utils, button, onReset };
}

// ─── Confirm dialog opens on click ───────────────────────────────────────────

describe('ResetButton — confirm dialog', () => {
  it('opens the confirm dialog when the button is clicked', async () => {
    const { button } = setup();

    await userEvent.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not show the dialog before the button is clicked', () => {
    setup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ─── Cancel path ──────────────────────────────────────────────────────────────

describe('ResetButton — cancel', () => {
  it('closes the dialog without calling onReset when Cancel is clicked', async () => {
    const { button, onReset } = setup();

    await userEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onReset).not.toHaveBeenCalled();
  });
});

// ─── Confirm path ─────────────────────────────────────────────────────────────

describe('ResetButton — confirm', () => {
  it('calls onReset when Confirm is clicked', async () => {
    const { button, onReset } = setup();

    await userEvent.click(button);
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
  });

  it('closes the dialog after confirming', async () => {
    const { button } = setup();

    await userEvent.click(button);
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});

// ─── Pending / disabled state ─────────────────────────────────────────────────

describe('ResetButton — pending state', () => {
  it('disables the button while the reset request is in-flight', async () => {
    const neverResolves = vi.fn(() => new Promise<void>(() => {}));
    const { button } = setup(neverResolves);

    await userEvent.click(button);
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => expect(button).toBeDisabled());
  });

  it('shows "Resetting…" label while pending', async () => {
    const neverResolves = vi.fn(() => new Promise<void>(() => {}));
    setup(neverResolves);

    await userEvent.click(screen.getByRole('button', { name: /reset system/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /resetting/i })).toBeInTheDocument()
    );
  });

  it('is disabled when the disabled prop is true', () => {
    render(<ResetButton disabled={true} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reset system/i })).toBeDisabled();
  });
});

// ─── 10-second timeout guard ──────────────────────────────────────────────────

describe('ResetButton — 10-second timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-enables the button after 10 seconds if onReset has not resolved', async () => {
    const neverResolves = vi.fn(() => new Promise<void>(() => {}));
    render(<ResetButton disabled={false} onReset={neverResolves} />);

    const resetBtn = screen.getByRole('button', { name: /reset system/i });

    // Open dialog and confirm — use fireEvent to avoid userEvent timer conflicts
    fireEvent.click(resetBtn);
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    // Flush the async handleConfirm microtasks so pending state is applied
    await act(async () => {
      await Promise.resolve();
    });

    // Button should be disabled (pending) now
    expect(resetBtn).toBeDisabled();

    // Advance timers by 10 seconds to trigger the timeout guard
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    // Button should be re-enabled after the timeout
    expect(resetBtn).not.toBeDisabled();
  });

  it('shows a timeout error message after 10 seconds', async () => {
    const neverResolves = vi.fn(() => new Promise<void>(() => {}));
    render(<ResetButton disabled={false} onReset={neverResolves} />);

    fireEvent.click(screen.getByRole('button', { name: /reset system/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    // Flush microtasks
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
