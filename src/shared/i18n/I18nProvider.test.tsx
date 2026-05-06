// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, LOCALE_STORAGE_KEY, useLocale } from '@/shared/i18n';

function LocaleConsumer({ onRender }: { onRender: (locale: string) => void }) {
  const { locale, messages, setLocale } = useLocale();
  onRender(locale);

  return (
    <div>
      <p>{messages.common.loading}</p>
      <p data-testid="locale">{locale}</p>
      <button type="button" onClick={() => setLocale('en')}>Use English</button>
    </div>
  );
}

describe('I18nProvider', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('updates React consumers when setLocale runs', async () => {
    const onRender = vi.fn();
    render(
      <I18nProvider>
        <LocaleConsumer onRender={onRender} />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
    const initialRenderCount = onRender.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: /use english/i }));

    expect(onRender.mock.calls.length).toBeGreaterThan(initialRenderCount);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('persists locale and preserves existing mode routing in the URL', async () => {
    window.history.replaceState({}, '', '/?mode=interactive');

    render(
      <I18nProvider>
        <LocaleConsumer onRender={() => undefined} />
      </I18nProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: /use english/i }));

    const params = new URLSearchParams(window.location.search);
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(params.get('mode')).toBe('interactive');
    expect(params.get('lang')).toBe('en');
  });

  it('syncs browser history changes into consumers', () => {
    window.history.replaceState({}, '', '/?lang=en');
    render(
      <I18nProvider>
        <LocaleConsumer onRender={() => undefined} />
      </I18nProvider>
    );

    window.history.pushState({}, '', '/?mode=static&lang=en');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(screen.getByTestId('locale').textContent).toBe('en');
  });
});
