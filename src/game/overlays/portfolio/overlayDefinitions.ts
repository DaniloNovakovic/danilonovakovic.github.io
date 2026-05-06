import type { OverlayDefinition } from '@/game/overlays/types';

export const PORTFOLIO_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'profile',
    load: () => import('./profile/ProfileOverlay')
  },
  {
    id: 'experiences',
    load: () => import('./experience/ExperienceOverlay')
  },
  {
    id: 'projects',
    load: () => import('./projects/ProjectsOverlay')
  },
  {
    id: 'abilities',
    load: () => import('./abilities/AbilitiesOverlay')
  },
  {
    id: 'contact',
    load: () => import('./contact/ContactOverlay')
  }
];
