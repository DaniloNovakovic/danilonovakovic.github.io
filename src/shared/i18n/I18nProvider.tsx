import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { I18nContext, type I18nContextValue } from './context';
import { getCurrentLocale, getMessages, setCurrentLocale } from './getMessages';
import { readLocaleFromBrowser, type Locale } from './locale';

interface I18nProviderProps {
  children: ReactNode;
}

interface LocaleState {
  locale: Locale;
  revision: number;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [state, setState] = useState<LocaleState>(() => {
    const locale = readLocaleFromBrowser();
    if (locale !== getCurrentLocale()) {
      setCurrentLocale(locale);
    }
    return {
      locale,
      revision: 0
    };
  });

  const setLocale = useCallback((locale: Locale) => {
    setCurrentLocale(locale);
    setState((current) => ({
      locale,
      revision: current.revision + 1
    }));
  }, []);

  useEffect(function syncLocaleFromBrowserHistory() {
    const onPopState = () => {
      const locale = readLocaleFromBrowser();
      setCurrentLocale(locale);
      setState((current) => ({
        locale,
        revision: current.revision + 1
      }));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value: I18nContextValue = {
    locale: state.locale,
    setLocale,
    messages: getMessages(state.locale)
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
