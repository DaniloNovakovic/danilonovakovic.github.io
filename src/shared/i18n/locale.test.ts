// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  readLocaleFromBrowser,
  resolveLocale
} from './locale';

describe('locale resolution', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('uses a valid query locale before localStorage', () => {
    expect(resolveLocale({ search: '?lang=en', storedLocale: 'zz' })).toBe('en');
  });

  it('falls back safely when the query locale is invalid', () => {
    expect(resolveLocale({ search: '?lang=zz', storedLocale: null })).toBe(DEFAULT_LOCALE);
  });

  it('uses localStorage when the URL has no locale', () => {
    expect(resolveLocale({ search: '?mode=interactive', storedLocale: 'en' })).toBe('en');
  });

  it('reads the browser URL and storage with English fallback', () => {
    window.history.replaceState({}, '', '/?mode=interactive');
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    expect(readLocaleFromBrowser()).toBe('en');

    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'nope');
    expect(readLocaleFromBrowser()).toBe(DEFAULT_LOCALE);
  });
});
