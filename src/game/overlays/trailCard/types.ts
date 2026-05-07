import type { SceneId } from '@/game/scenes/sceneIds';

export interface TrailCardOverlayParams {
  title: string;
  mood: string;
  timeEstimate: string;
  rewardPreview: string;
  unavailableReason?: string;
  enterSceneId?: SceneId;
}
