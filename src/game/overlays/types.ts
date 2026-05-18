import type { ComponentType } from 'react';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from './overlayIds';
import type { SceneId } from '@/game/scenes/sceneIds';

export interface OverlayControllerProps {
  params?: unknown;
  close: () => void;
  enterScene: (sceneId: SceneId) => void;
  openOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  titleId: string;
  descriptionId: string;
}

export type OverlayComponent = ComponentType<OverlayControllerProps>;

export interface OverlayDefinition {
  id: OverlayId;
  component: OverlayComponent;
}
