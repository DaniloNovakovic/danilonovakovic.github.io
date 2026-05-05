import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '../../modePicker/ModePicker';

export type RouteState = 'picker' | AppMode;

function readModeFromUrl(): RouteState {
  if (typeof window === 'undefined') return 'picker';
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'interactive' || mode === 'static') return mode;
  return 'picker';
}

function writeModeToUrl(mode: RouteState) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (mode === 'picker') {
    url.searchParams.delete('mode');
  } else {
    url.searchParams.set('mode', mode);
  }
  window.history.replaceState({}, '', url.toString());
}

export function useReadMode() {
  const [route, setRoute] = useState<RouteState>(() => readModeFromUrl());

  const setMode = useCallback((next: RouteState) => {
    setRoute(next);
    writeModeToUrl(next);
  }, []);

  useEffect(function syncRouteFromBrowserHistory() {
    const onPopState = () => setRoute(readModeFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { route, setMode };
}
