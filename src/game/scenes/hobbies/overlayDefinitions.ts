import { createElement, lazy } from 'react';
import type { OverlayDefinition, OverlayComponentProps } from '@/game/overlays/types';
import { getMessages } from '@/shared/i18n';

const LazyDrawingCanvas = lazy(() => import('./overlays/art/DrawingCanvas'));
const LazyDancingOverlay = lazy(() => import('./overlays/dancing/DancingOverlay'));
const LazyMuayThaiOverlay = lazy(() => import('./overlays/fitness/MuayThaiOverlay'));
const LazyGuitarStrings = lazy(() => import('./overlays/music/GuitarStrings'));
const messages = getMessages();

function DrawingCanvas(props: OverlayComponentProps) {
  return createElement(LazyDrawingCanvas, props);
}

function DancingOverlay(props: OverlayComponentProps) {
  return createElement(LazyDancingOverlay, props);
}

function MuayThaiOverlay(props: OverlayComponentProps) {
  return createElement(LazyMuayThaiOverlay, props);
}

function GuitarStrings(props: OverlayComponentProps) {
  return createElement(LazyGuitarStrings, props);
}

export const HOBBIES_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'art',
    title: messages.catalog.hobbies.art.name,
    description: messages.catalog.hobbies.art.description,
    component: DrawingCanvas,
    loadComponent: () => import('./overlays/art/DrawingCanvas'),
    includeInDevSwitcher: true
  },
  {
    id: 'music',
    title: messages.catalog.hobbies.music.name,
    description: messages.catalog.hobbies.music.description,
    component: GuitarStrings,
    loadComponent: () => import('./overlays/music/GuitarStrings'),
    includeInDevSwitcher: true
  },
  {
    id: 'fitness',
    title: messages.catalog.hobbies.fitness.name,
    description: messages.catalog.hobbies.fitness.description,
    component: MuayThaiOverlay,
    loadComponent: () => import('./overlays/fitness/MuayThaiOverlay'),
    includeInDevSwitcher: true
  },
  {
    id: 'dancing',
    title: messages.catalog.hobbies.dancing.name,
    description: messages.catalog.hobbies.dancing.description,
    component: DancingOverlay,
    loadComponent: () => import('./overlays/dancing/DancingOverlay'),
    includeInDevSwitcher: true
  }
];
