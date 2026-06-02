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
    const target = await this.prepareContext(contextId, guard);
    if (!target || this.isGuardStale(guard)) return;

    if (this.adapter.isSceneActive(target.sceneKey)) {
      this.clearLoadingIfCurrent(guard);
      return;
    }

    this.stopActiveContextsExcept(target.sceneKey);
    if (this.isGuardStale(guard)) return;
    this.startContext(target);
  }

  async exitTo(contextId: ContextId, guard?: SceneTransitionGuard): Promise<void> {
    const target = await this.prepareContext(contextId, guard);
    if (!target || this.isGuardStale(guard)) return;

    const allKeys = this.adapter.listKnownSceneKeys();
    for (const sceneKey of allKeys) {
      if (sceneKey === target.sceneKey) continue;
      if (!this.adapter.isSceneActive(sceneKey)) continue;
      const resumeSnapshot = this.captureResumeBySceneKey(sceneKey);
      this.adapter.stopScene(sceneKey);
      const context = this.findContextBySceneKey(sceneKey);
      context?.onExit?.(resumeSnapshot);
    }

    if (!this.adapter.isSceneActive(target.sceneKey) && !this.isGuardStale(guard)) {
      this.startContext(target);
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

  private async prepareContext(
    contextId: ContextId,
    guard?: SceneTransitionGuard
  ): Promise<SceneContextDefinition | null> {
    const target = this.contexts.get(contextId);
    if (!target) {
      this.clearLoadingIfCurrent(guard);
      return null;
    }

    const loadedScene = await this.ensureSceneRegistered(target, guard);
    if (guard && !guard.isCurrent()) return null;
    if (!loadedScene) {
      this.clearLoadingIfCurrent(guard);
    }
    return target;
  }

  private startContext(target: SceneContextDefinition): void {
    this.adapter.startScene(target.sceneKey, target.getStartData());
    target.onEnter?.();
    this.options.onSceneStarted?.();
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

  private isGuardStale(guard?: SceneTransitionGuard): boolean {
    return guard !== undefined && !guard.isCurrent();
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
