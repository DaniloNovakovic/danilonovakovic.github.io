import type { RidgeViewerRect } from '../model';
import type { Selection } from '../types';

export function RectLayer({
  rects,
  onSelect
}: {
  rects: readonly RidgeViewerRect[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-rects">
      {rects.map((rect) => (
        <rect
          aria-label={`Rect ${rect.id}`}
          fill="#f0a7c8"
          fillOpacity="0.18"
          height={rect.height}
          key={`${rect.roomId}:${rect.id}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'rect', id: `${rect.roomId}:${rect.id}` });
          }}
          role="button"
          stroke="#b13b75"
          strokeDasharray="10 8"
          strokeWidth="5"
          tabIndex={0}
          width={rect.width}
          x={rect.x}
          y={rect.y}
        />
      ))}
    </g>
  );
}
