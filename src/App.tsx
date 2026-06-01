import { Suspense, lazy } from 'react';
import { ModePicker } from './modePicker';
import { useReadMode } from '@/shared/hooks/useReadMode';
import { LoadingFallback } from '@/shared/ui';
import { StaticPortfolio } from '@/static';

const InteractiveApp = lazy(() => import('@/game/shell'));
const RidgeStageDebugger = lazy(() => import('@/dev/ridgeStageDebugger'));

function App() {
  const { route, setMode } = useReadMode();

  if (route === 'picker') {
    return <ModePicker onChoose={setMode} />;
  }

  if (route === 'static') {
    return <StaticPortfolio onSwitchToInteractive={() => setMode('interactive')} />;
  }

  if (import.meta.env.DEV && route === 'ridge-stage-debugger') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <RidgeStageDebugger />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <InteractiveApp onSwitchToStatic={() => setMode('static')} />
    </Suspense>
  );
}

export default App;
