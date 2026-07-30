import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '../../modePicker';

export type RouteState = 'picker' | AppMode;

export function readRouteStateFromSearch(search: string): RouteState {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  if (mode === 'interactive' || mode === 'static') return mode;
  return 'picker';
}

function readModeFromUrl(): RouteState {
  if (typeof window === 'undefined') return 'picker';
  return readRouteStateFromSearch(window.location.search);
}

function writeModeToUrl(mode: RouteState) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (mode === 'interactive' || mode === 'static') {
    url.searchParams.set('mode', mode);
  } else {
    url.searchParams.delete('mode');
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
