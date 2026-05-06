import type { ComponentType, LazyExoticComponent } from 'react';
import type { OverlayId } from './overlayIds';

// Extend this when overlay components need shared host props.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface OverlayComponentProps {}

export interface OverlayDefinition {
  id: OverlayId;
  title: string;
  description?: string;
  component: ComponentType<OverlayComponentProps> | LazyExoticComponent<ComponentType<OverlayComponentProps>>;
  loadComponent: () => Promise<{ default: ComponentType<OverlayComponentProps> }>;
  includeInDevSwitcher?: boolean;
}
