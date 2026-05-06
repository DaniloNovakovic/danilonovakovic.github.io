import { lazy, Suspense, type ReactNode } from 'react';
import type { OverlayComponent, OverlayControllerProps } from './types';

export function lazyOverlay(
  load: () => Promise<{ default: OverlayComponent }>,
  fallback: ReactNode = null
): OverlayComponent {
  const LazyOverlay = lazy(load);

  function LazyLoadedOverlay(props: OverlayControllerProps) {
    return (
      <Suspense fallback={fallback}>
        <LazyOverlay {...props} />
      </Suspense>
    );
  }

  LazyLoadedOverlay.displayName = 'LazyLoadedOverlay';
  return LazyLoadedOverlay;
}
