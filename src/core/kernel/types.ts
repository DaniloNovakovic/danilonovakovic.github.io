export type ContextId = string;

export type TransitionReason = 'user_interaction' | 'overlay_closed' | 'boot' | 'sync';

export interface ResumeSnapshot {
  x: number;
  y: number;
}

export interface ContextPluginDefinition {
  id: ContextId;
  sceneKey: string;
  getStartData: () => Record<string, unknown>;
  onRegister?: () => void;
  onEnter?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExit?: () => void;
  onDispose?: () => void;
}
