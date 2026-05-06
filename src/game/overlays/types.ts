import type { ComponentType } from 'react';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from './overlayIds';

export interface OverlayControllerProps {
  params?: unknown;
  close: () => void;
  openOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  titleId: string;
  descriptionId: string;
}

export type OverlayComponent = ComponentType<OverlayControllerProps>;

export interface OverlayDefinition {
  id: OverlayId;
  component: OverlayComponent;
}
