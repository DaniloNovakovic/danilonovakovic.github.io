import { useState } from 'react';
import type { ViewerView } from '../types';

export function useRidgeViewerView() {
  const [activeView, setActiveView] = useState<ViewerView>(() => readInitialViewerView());

  const switchView = (nextView: ViewerView) => {
    setActiveView(nextView);
    writeViewerViewToUrl(nextView);
  };

  return { activeView, switchView };
}

function readInitialViewerView(): ViewerView {
  if (typeof window === 'undefined') return 'preview';
  return new URLSearchParams(window.location.search).get('view') === 'model'
    ? 'model'
    : 'preview';
}

function writeViewerViewToUrl(view: ViewerView): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'ridge-blockout');
  url.searchParams.set('view', view);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}
