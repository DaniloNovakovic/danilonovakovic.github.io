export type EntityId = number;

export interface ComponentStore<T> {
  name: string;
  values: Map<EntityId, T>;
}

export class EcsWorld {
  private nextEntityId: EntityId = 1;
  private readonly stores = new Map<string, ComponentStore<unknown>>();

  createEntity(): EntityId {
    const id = this.nextEntityId;
    this.nextEntityId += 1;
    return id;
  }

  registerComponent<T>(name: string): ComponentStore<T> {
    const existing = this.stores.get(name);
    if (existing) {
      return existing as ComponentStore<T>;
    }
    const store: ComponentStore<T> = {
      name,
      values: new Map<EntityId, T>()
    };
    this.stores.set(name, store as ComponentStore<unknown>);
    return store;
  }

  setComponent<T>(store: ComponentStore<T>, entity: EntityId, value: T): void {
    store.values.set(entity, value);
  }

  getComponent<T>(store: ComponentStore<T>, entity: EntityId): T | undefined {
    return store.values.get(entity);
  }

  /** Clear all component data and reset entity counter. Call at scene (re)start. */
  reset(): void {
    this.nextEntityId = 1;
    this.stores.forEach((store) => store.values.clear());
  }
}
