import { LAYER_LABELS } from '../constants';
import type { RidgeViewerLayerId } from '../model';
import type { LayerState } from '../types';

export function LayerPanel({
  layers,
  onToggle
}: {
  layers: LayerState;
  onToggle: (layerId: RidgeViewerLayerId) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Layers</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
        {(Object.keys(LAYER_LABELS) as RidgeViewerLayerId[]).map((layerId) => (
          <label
            className="flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1.5 transition-colors hover:bg-[#efe8d8]"
            key={layerId}
          >
            <input
              checked={layers[layerId]}
              className="h-4 w-4 cursor-pointer accent-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              onChange={() => onToggle(layerId)}
              type="checkbox"
            />
            <span>{LAYER_LABELS[layerId]}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
