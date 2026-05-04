import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import ModePicker, { type AppMode } from './modes/picker/ModePicker';
import StaticPortfolio from './modes/static/StaticPortfolio';
import { TEXTS } from '../config/content';
import { Card } from '@shared/ui';

const InteractiveApp = lazy(() => import('./modes/interactive/InteractiveApp'));

type RouteState = 'picker' | AppMode;

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

function LoadingFallback() {
  return (
    <div className="flex min-h-[100dvh] min-h-dvh w-full items-center justify-center bg-[#f4f1ea]">
      <Card tone="paper" className="px-6 py-4">
        <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
          {TEXTS.common.loading}
        </p>
      </Card>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<RouteState>(() => readModeFromUrl());

  const setMode = useCallback((next: RouteState) => {
    setRoute(next);
    writeModeToUrl(next);
  }, []);

  useEffect(() => {
    const onPopState = () => setRoute(readModeFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (route === 'picker') {
    return <ModePicker onChoose={setMode} />;
  }

  if (route === 'static') {
    return <StaticPortfolio onSwitchToInteractive={() => setMode('interactive')} />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <InteractiveApp onSwitchToStatic={() => setMode('static')} />
    </Suspense>
  );
}

export default App;
