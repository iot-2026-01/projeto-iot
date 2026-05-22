import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CurrentUpdateForm } from '../components/CurrentUpdateForm';

// Helper: render the form with a no-op onSubmit by default
function setup(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const utils = render(
    <CurrentUpdateForm channelId="A" disabled={false} onSubmit={onSubmit} />
  );
  const input = screen.getByRole('spinbutton');
  const button = screen.getByRole('button', { name: /submit current update/i });
  const form = button.closest('form')!;
  return { ...utils, input, button, form, onSubmit };
}

// ─── Validation error tests ───────────────────────────────────────────────────

describe('CurrentUpdateForm — validation errors', () => {
  it('shows a validation error when a negative value is submitted', async () => {
    const { input, form } = setup();

    await userEvent.type(input, '-1');
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows a validation error when value exceeds 999.99', async () => {
    const { input, form } = setup();

    await userEvent.type(input, '1000');
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows a validation error when the field contains NaN (non-numeric text)', async () => {
    const { input, form } = setup();

    // fireEvent.change bypasses the number input's native filtering so we can
    // test the component's own NaN guard.
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('does not call onSubmit when the value is invalid', async () => {
    const { input, form, onSubmit } = setup();

    await userEvent.type(input, '-5');
    fireEvent.submit(form);

    await screen.findByRole('alert');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ─── Validation error clears on correction ────────────────────────────────────

describe('CurrentUpdateForm — error clears on valid input', () => {
  it('clears the validation error when the value is corrected to a valid number', async () => {
    const { input, form } = setup();

    // Trigger an error first
    await userEvent.type(input, '-1');
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    // Clear the field and type a valid value
    await userEvent.clear(input);
    await userEvent.type(input, '10');

    // Error should be gone
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the error when an out-of-range value is corrected to 0', async () => {
    const { input, form } = setup();

    await userEvent.type(input, '9999');
    fireEvent.submit(form);
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, '0');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ─── Pending / disabled state ─────────────────────────────────────────────────

describe('CurrentUpdateForm — pending state', () => {
  it('disables the input and button while the request is in-flight', async () => {
    // onSubmit returns a promise that never resolves → keeps component in pending state
    const neverResolves = vi.fn(() => new Promise<void>(() => {}));
    const { input, form, button } = setup(neverResolves);

    await userEvent.type(input, '42');
    fireEvent.submit(form);

    // Wait for the pending state to be applied
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  it('re-enables input and button after the request completes', async () => {
    const { input, form, button, onSubmit } = setup();

    await userEvent.type(input, '42');
    fireEvent.submit(form);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(button).not.toBeDisabled();
    });
  });

  it('disables input and button when the disabled prop is true', () => {
    render(
      <CurrentUpdateForm
        channelId="B"
        disabled={true}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit current update/i })).toBeDisabled();
  });
});
