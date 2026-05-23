import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../i18n';
import { SUPPORTED_LOCALES, LOCALE_LABELS, DEFAULT_LOCALE } from '../i18n/types';
import { LanguageSelector } from '../components/LanguageSelector';

beforeEach(async () => {
  await i18n.changeLanguage(DEFAULT_LOCALE);
});

// ─── Renders all locale options with native names ─────────────────────────────

describe('LanguageSelector — renders all locale options', () => {
  it('renders an option for each supported locale with its native name', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i });
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(SUPPORTED_LOCALES.length);

    SUPPORTED_LOCALES.forEach((locale) => {
      const option = options.find((opt) => opt.value === locale);
      expect(option).toBeDefined();
      expect(option!.textContent).toBe(LOCALE_LABELS[locale]);
    });
  });

  it('displays "Português" and "English" as option labels', () => {
    render(<LanguageSelector />);

    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
});

// ─── Shows current active locale as selected ──────────────────────────────────

describe('LanguageSelector — shows active locale as selected', () => {
  it('shows pt-BR as selected when it is the active locale', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i }) as HTMLSelectElement;
    expect(select.value).toBe('pt-BR');
  });

  it('shows en as selected when English is the active locale', async () => {
    await i18n.changeLanguage('en');

    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i }) as HTMLSelectElement;
    expect(select.value).toBe('en');
  });
});

// ─── Switching locale updates i18n language ───────────────────────────────────

describe('LanguageSelector — switching locale updates language', () => {
  it('changes i18n language to en when English is selected', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i });
    await user.selectOptions(select, 'en');

    expect(i18n.language).toBe('en');
  });

  it('changes i18n language back to pt-BR when Português is selected', async () => {
    await i18n.changeLanguage('en');
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i });
    await user.selectOptions(select, 'pt-BR');

    expect(i18n.language).toBe('pt-BR');
  });

  it('updates the selected value in the dropdown after switching', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /language selector/i }) as HTMLSelectElement;
    expect(select.value).toBe('pt-BR');

    await user.selectOptions(select, 'en');
    expect(select.value).toBe('en');
  });
});
