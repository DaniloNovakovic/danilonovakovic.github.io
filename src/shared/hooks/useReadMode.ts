import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '../../modePicker';

export type DevToolMode = 'ridge-blockout';
export type RouteState = 'picker' | AppMode | DevToolMode;

export function readRouteStateFromSearch(
  search: string,
  isDev = import.meta.env.DEV
): RouteState {
  const params = new URLSearchParams(search);
  const mode = params.get('mode');
  if (mode === 'interactive' || mode === 'static') return mode;
  if (isDev && mode === 'ridge-blockout') return mode;
  return 'picker';
}

function readModeFromUrl(): RouteState {
  if (typeof window === 'undefined') return 'picker';
  return readRouteStateFromSearch(window.location.search);
}

function isPublicMode(mode: RouteState): mode is AppMode {
  return mode === 'interactive' || mode === 'static';
}

function isDevToolMode(mode: RouteState): mode is DevToolMode {
  return mode === 'ridge-blockout';
}

function canWriteModeToUrl(mode: RouteState): mode is AppMode | DevToolMode {
  return isPublicMode(mode) || (import.meta.env.DEV && isDevToolMode(mode));
}

function writeModeToUrl(mode: RouteState) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (canWriteModeToUrl(mode)) {
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
