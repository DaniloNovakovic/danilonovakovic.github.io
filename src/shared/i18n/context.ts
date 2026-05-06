import { createContext } from 'react';
import type { Locale } from './locale';
import type { Messages } from './messages/types';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
