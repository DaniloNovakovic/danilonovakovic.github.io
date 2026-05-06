import { createElement, lazy } from 'react';
import type { OverlayDefinition, OverlayComponentProps } from '@/game/overlays/types';
import { getMessages } from '@/shared/i18n';

const LazyCodingOverlay = lazy(() => import('./overlays/developerConsole/CodingOverlay'));
const messages = getMessages();

function CodingOverlay(props: OverlayComponentProps) {
  return createElement(LazyCodingOverlay, props);
}

export const BASEMENT_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'games',
    title: messages.catalog.basement.games.name,
    description: messages.catalog.basement.games.description,
    component: CodingOverlay,
    loadComponent: () => import('./overlays/developerConsole/CodingOverlay'),
    includeInDevSwitcher: true
  }
];
