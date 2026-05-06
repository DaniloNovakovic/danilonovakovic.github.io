export const SUPPORTED_LOCALES = ['en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_QUERY_PARAM = 'lang';
export const LOCALE_STORAGE_KEY = 'portfolio:locale';

export interface LocaleStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(input: {
  search?: string;
  storedLocale?: string | null;
} = {}): Locale {
  const params = new URLSearchParams(input.search ?? '');
  const queryLocale = params.get(LOCALE_QUERY_PARAM);
  if (isLocale(queryLocale)) return queryLocale;
  if (isLocale(input.storedLocale)) return input.storedLocale;
  return DEFAULT_LOCALE;
}

export function readStoredLocale(storage: LocaleStorageLike | null = getBrowserStorage()): Locale | null {
  if (!storage) return null;
  try {
    const stored = storage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(
  locale: Locale,
  storage: LocaleStorageLike | null = getBrowserStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    return;
  }
}

export function readLocaleFromBrowser(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return resolveLocale({
    search: window.location.search,
    storedLocale: readStoredLocale(window.localStorage)
  });
}

export function writeLocaleToBrowserUrl(locale: Locale): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(LOCALE_QUERY_PARAM, locale);
  window.history.replaceState({}, '', url.toString());
}

function getBrowserStorage(): LocaleStorageLike | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
