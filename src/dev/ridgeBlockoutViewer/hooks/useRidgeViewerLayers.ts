import { useState } from 'react';
import { DEFAULT_LAYERS } from '../constants';
import type { RidgeViewerLayerId } from '../model';

export function useRidgeViewerLayers() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);

  const toggleLayer = (layerId: RidgeViewerLayerId) => {
    setLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  };

  return { layers, toggleLayer };
}
