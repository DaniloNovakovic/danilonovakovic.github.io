import { Suspense, lazy } from 'react';
import ModePicker from './modePicker/ModePicker';
import { useReadMode } from '@shared/hooks/useReadMode';
import { LoadingFallback } from '@shared/ui';
import StaticPortfolio from '@static/StaticPortfolio';

const InteractiveApp = lazy(() => import('@game/shell/InteractiveApp'));

function App() {
  const { route, setMode } = useReadMode();

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
