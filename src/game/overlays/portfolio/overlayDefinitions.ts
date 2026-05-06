import type { OverlayDefinition } from '@/game/overlays/types';
import { lazyOverlay } from '@/game/overlays/lazyOverlay';

export const PORTFOLIO_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'profile',
    component: lazyOverlay(() => import('./profile/ProfileOverlay'))
  },
  {
    id: 'experiences',
    component: lazyOverlay(() => import('./experience/ExperienceOverlay'))
  },
  {
    id: 'projects',
    component: lazyOverlay(() => import('./projects/ProjectsOverlay'))
  },
  {
    id: 'abilities',
    component: lazyOverlay(() => import('./abilities/AbilitiesOverlay'))
  },
  {
    id: 'contact',
    component: lazyOverlay(() => import('./contact/ContactOverlay'))
  }
];
