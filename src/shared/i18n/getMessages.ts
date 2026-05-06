import { enMessages } from './messages/en';
import {
  DEFAULT_LOCALE,
  readLocaleFromBrowser,
  writeLocaleToBrowserUrl,
  writeStoredLocale,
  type Locale
} from './locale';
import type { Messages } from './messages/types';

const MESSAGES_BY_LOCALE: Record<Locale, Messages> = {
  en: enMessages
};

let currentLocale: Locale = readLocaleFromBrowser();

export function getMessages(locale: Locale = currentLocale): Messages {
  return MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE[DEFAULT_LOCALE];
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function setCurrentLocale(locale: Locale): void {
  currentLocale = locale;
  writeStoredLocale(locale);
  writeLocaleToBrowserUrl(locale);
}
