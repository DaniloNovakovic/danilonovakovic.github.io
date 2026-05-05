export type ContextId = string;

export type TransitionReason = 'user_interaction' | 'overlay_closed' | 'boot' | 'sync';

export interface ResumeSnapshot {
  x: number;
  y: number;
}

/**
 * Declarative lifecycle contract for a scene context known to `SceneManager`.
 *
 * Context plugins keep scene-specific wiring out of the shell: the manager can
 * register/load/start/pause/exit contexts through this interface without
 * knowing whether a context is the overworld, an interior room, or a standalone
 * Phaser mini-game.
 */
export interface ContextPluginDefinition {
  id: ContextId;
  sceneKey: string;
  getStartData: () => Record<string, unknown>;
  loadScene?: () => Promise<unknown>;
  onRegister?: () => void;
  onEnter?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onExit?: (resumeSnapshot: ResumeSnapshot | null) => void;
  onDispose?: () => void;
}
