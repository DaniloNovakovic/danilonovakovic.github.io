import type { ContextId, ContextPluginDefinition, ResumeSnapshot } from './types';

export interface SceneRuntimeAdapter {
  isSceneActive(sceneKey: string): boolean;
  startScene(sceneKey: string, data: Record<string, unknown>): void;
  stopScene(sceneKey: string): void;
  listKnownSceneKeys(): string[];
  setPauseOnActiveScenes(paused: boolean): void;
  captureResume(sceneKey: string): ResumeSnapshot | null;
}

export class SceneManager {
  private readonly contexts = new Map<ContextId, ContextPluginDefinition>();
  private readonly adapter: SceneRuntimeAdapter;

  constructor(adapter: SceneRuntimeAdapter) {
    this.adapter = adapter;
  }

  registerContext(def: ContextPluginDefinition): void {
    this.contexts.set(def.id, def);
    def.onRegister?.();
  }

  enter(contextId: ContextId): void {
    const target = this.contexts.get(contextId);
    if (!target) return;

    if (this.adapter.isSceneActive(target.sceneKey)) return;

    this.stopActiveContextsExcept(target.sceneKey);

    this.adapter.startScene(target.sceneKey, target.getStartData());
    target.onEnter?.();
  }

  exitTo(contextId: ContextId): void {
    const target = this.contexts.get(contextId);
    if (!target) return;

    const allKeys = this.adapter.listKnownSceneKeys();
    for (const sceneKey of allKeys) {
      if (sceneKey === target.sceneKey) continue;
      if (!this.adapter.isSceneActive(sceneKey)) continue;
      this.captureResumeBySceneKey(sceneKey);
      this.adapter.stopScene(sceneKey);
      const context = this.findContextBySceneKey(sceneKey);
      context?.onExit?.();
    }

    if (!this.adapter.isSceneActive(target.sceneKey)) {
      this.adapter.startScene(target.sceneKey, target.getStartData());
      target.onEnter?.();
    }
  }

  captureResume(contextId: ContextId): ResumeSnapshot | null {
    const context = this.contexts.get(contextId);
    if (!context) return null;
    return this.captureResumeBySceneKey(context.sceneKey);
  }

  applyPause(scope: 'engine' | 'ui' | 'all', paused: boolean): void {
    if (scope === 'ui') return;
    this.adapter.setPauseOnActiveScenes(paused);
    this.contexts.forEach((context) => {
      if (!this.adapter.isSceneActive(context.sceneKey)) return;
      if (paused) {
        context.onPause?.();
      } else {
        context.onResume?.();
      }
    });
  }

  dispose(): void {
    this.contexts.forEach((context) => context.onDispose?.());
  }

  private findContextBySceneKey(sceneKey: string): ContextPluginDefinition | undefined {
    for (const context of this.contexts.values()) {
      if (context.sceneKey === sceneKey) return context;
    }
    return undefined;
  }

  private captureResumeBySceneKey(sceneKey: string): ResumeSnapshot | null {
    return this.adapter.captureResume(sceneKey);
  }

  private stopActiveContextsExcept(targetSceneKey: string): void {
    this.contexts.forEach((context) => {
      if (context.sceneKey === targetSceneKey) return;
      if (!this.adapter.isSceneActive(context.sceneKey)) return;
      this.captureResumeBySceneKey(context.sceneKey);
      this.adapter.stopScene(context.sceneKey);
      context.onExit?.();
    });
  }
}
