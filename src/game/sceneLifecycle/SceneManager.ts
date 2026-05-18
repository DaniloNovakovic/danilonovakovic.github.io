import type { ContextId, ResumeSnapshot, SceneContextDefinition } from './types';

export interface SceneRuntimeAdapter {
  hasScene(sceneKey: string): boolean;
  registerScene(sceneKey: string, scene: unknown): void;
  isSceneActive(sceneKey: string): boolean;
  startScene(sceneKey: string, data: Record<string, unknown>): void;
  stopScene(sceneKey: string): void;
  listKnownSceneKeys(): string[];
  setPauseOnActiveScenes(paused: boolean): void;
  captureResume(sceneKey: string): ResumeSnapshot | null;
}

interface SceneManagerOptions {
  onSceneLoadingChange?: (contextId: ContextId | null) => void;
  onSceneStarted?: () => void;
}

export interface SceneTransitionGuard {
  isCurrent: () => boolean;
}

export class SceneManager {
  private readonly contexts = new Map<ContextId, SceneContextDefinition>();
  private readonly adapter: SceneRuntimeAdapter;
  private readonly options: SceneManagerOptions;

  constructor(adapter: SceneRuntimeAdapter, options: SceneManagerOptions = {}) {
    this.adapter = adapter;
    this.options = options;
  }

  registerContext(def: SceneContextDefinition): void {
    this.contexts.set(def.id, def);
    def.onRegister?.();
  }

  async enter(contextId: ContextId, guard?: SceneTransitionGuard): Promise<void> {
    const target = this.contexts.get(contextId);
    if (!target) {
      this.clearLoadingIfCurrent(guard);
      return;
    }

    if (this.adapter.isSceneActive(target.sceneKey)) {
      this.clearLoadingIfCurrent(guard);
      return;
    }

    const loadedScene = await this.ensureSceneRegistered(target, guard);
    if (guard && !guard.isCurrent()) return;
    if (!loadedScene) {
      this.clearLoadingIfCurrent(guard);
    }
    this.stopActiveContextsExcept(target.sceneKey);

    this.adapter.startScene(target.sceneKey, target.getStartData());
    target.onEnter?.();
    this.options.onSceneStarted?.();
  }

  async exitTo(contextId: ContextId, guard?: SceneTransitionGuard): Promise<void> {
    const target = this.contexts.get(contextId);
    if (!target) {
      this.clearLoadingIfCurrent(guard);
      return;
    }

    const loadedScene = await this.ensureSceneRegistered(target, guard);
    if (guard && !guard.isCurrent()) return;
    if (!loadedScene) {
      this.clearLoadingIfCurrent(guard);
    }
    const allKeys = this.adapter.listKnownSceneKeys();
    for (const sceneKey of allKeys) {
      if (sceneKey === target.sceneKey) continue;
      if (!this.adapter.isSceneActive(sceneKey)) continue;
      const resumeSnapshot = this.captureResumeBySceneKey(sceneKey);
      this.adapter.stopScene(sceneKey);
      const context = this.findContextBySceneKey(sceneKey);
      context?.onExit?.(resumeSnapshot);
    }

    if (!this.adapter.isSceneActive(target.sceneKey)) {
      this.adapter.startScene(target.sceneKey, target.getStartData());
      target.onEnter?.();
      this.options.onSceneStarted?.();
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
    this.options.onSceneLoadingChange?.(null);
    this.contexts.forEach((context) => context.onDispose?.());
  }

  private findContextBySceneKey(sceneKey: string): SceneContextDefinition | undefined {
    for (const context of this.contexts.values()) {
      if (context.sceneKey === sceneKey) return context;
    }
    return undefined;
  }

  private captureResumeBySceneKey(sceneKey: string): ResumeSnapshot | null {
    return this.adapter.captureResume(sceneKey);
  }

  private async ensureSceneRegistered(
    context: SceneContextDefinition,
    guard?: SceneTransitionGuard
  ): Promise<boolean> {
    if (this.adapter.hasScene(context.sceneKey)) return false;
    if (!context.loadScene) return false;

    this.options.onSceneLoadingChange?.(context.id);
    try {
      const scene = await context.loadScene();
      this.adapter.registerScene(context.sceneKey, scene);
      return true;
    } finally {
      this.clearLoadingIfCurrent(guard);
    }
  }

  private clearLoadingIfCurrent(guard?: SceneTransitionGuard): void {
    if (guard && !guard.isCurrent()) return;
    this.options.onSceneLoadingChange?.(null);
  }

  private stopActiveContextsExcept(targetSceneKey: string): void {
    this.contexts.forEach((context) => {
      if (context.sceneKey === targetSceneKey) return;
      if (!this.adapter.isSceneActive(context.sceneKey)) return;
      const resumeSnapshot = this.captureResumeBySceneKey(context.sceneKey);
      this.adapter.stopScene(context.sceneKey);
      context.onExit?.(resumeSnapshot);
    });
  }
}
