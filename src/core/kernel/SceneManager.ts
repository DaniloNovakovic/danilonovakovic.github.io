import type { ContextId, ContextPluginDefinition, ResumeSnapshot } from './types';

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
}

export interface SceneTransitionGuard {
  isCurrent: () => boolean;
}

export class SceneManager {
  private readonly contexts = new Map<ContextId, ContextPluginDefinition>();
  private readonly adapter: SceneRuntimeAdapter;
  private readonly options: SceneManagerOptions;

  constructor(adapter: SceneRuntimeAdapter, options: SceneManagerOptions = {}) {
    this.adapter = adapter;
    this.options = options;
  }

  registerContext(def: ContextPluginDefinition): void {
    this.contexts.set(def.id, def);
    def.onRegister?.();
  }

  async enter(contextId: ContextId, guard?: SceneTransitionGuard): Promise<void> {
    const target = this.contexts.get(contextId);
    if (!target) return;

    if (this.adapter.isSceneActive(target.sceneKey)) return;

    await this.ensureSceneRegistered(target, guard);
    if (guard && !guard.isCurrent()) return;
    this.stopActiveContextsExcept(target.sceneKey);

    this.adapter.startScene(target.sceneKey, target.getStartData());
    target.onEnter?.();
  }

  async exitTo(contextId: ContextId, guard?: SceneTransitionGuard): Promise<void> {
    const target = this.contexts.get(contextId);
    if (!target) return;

    await this.ensureSceneRegistered(target, guard);
    if (guard && !guard.isCurrent()) return;
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

  private async ensureSceneRegistered(
    context: ContextPluginDefinition,
    guard?: SceneTransitionGuard
  ): Promise<void> {
    if (this.adapter.hasScene(context.sceneKey)) return;
    if (!context.loadScene) return;

    this.options.onSceneLoadingChange?.(context.id);
    try {
      const scene = await context.loadScene();
      this.adapter.registerScene(context.sceneKey, scene);
    } finally {
      if (!guard || guard.isCurrent()) {
        this.options.onSceneLoadingChange?.(null);
      }
    }
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
