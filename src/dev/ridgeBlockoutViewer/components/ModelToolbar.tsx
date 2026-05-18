import { Minus, Plus, RotateCcw } from 'lucide-react';
import { IconButton } from './IconButton';

export function ModelToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 p-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
      <IconButton ariaLabel="Zoom out" onClick={onZoomOut}>
        <Minus className="h-4 w-4" aria-hidden />
      </IconButton>
      <span className="min-w-14 text-center font-mono text-xs font-black">
        {Math.round(zoom * 100)}%
      </span>
      <IconButton ariaLabel="Zoom in" onClick={onZoomIn}>
        <Plus className="h-4 w-4" aria-hidden />
      </IconButton>
      <IconButton ariaLabel="Reset map view" onClick={onReset}>
        <RotateCcw className="h-4 w-4" aria-hidden />
      </IconButton>
    </div>
  );
}
