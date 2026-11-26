import { Suspense, lazy } from 'react';
import { ModePicker } from './modePicker';
import { useReadMode } from '@/shared/hooks/useReadMode';
import { LoadingFallback } from '@/shared/ui';
import { StaticPortfolio } from '@/static';
import { ScreenDamageLayer } from '@/game/shell/ScreenDamageLayer';

const InteractiveApp = lazy(() => import('@/game/shell'));

function App() {
  const { route, setMode } = useReadMode();

  return (
    <>
      <AppRoute route={route} setMode={setMode} />
      {/* Screen cracks (#163) are on the glass, not the game: they stay over every mode until reload. */}
      <ScreenDamageLayer />
    </>
  );
}

function AppRoute({ route, setMode }: ReturnType<typeof useReadMode>) {
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
