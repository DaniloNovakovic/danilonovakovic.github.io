import type { RidgeViewerAnchor } from '../model';
import type { Selection } from '../types';

export function AnchorLayer({
  anchors,
  onSelect
}: {
  anchors: readonly RidgeViewerAnchor[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-anchors">
      {anchors.map((anchor) => (
        <g
          aria-label={`Anchor ${anchor.symbol} in ${anchor.roomTitle}: ${anchor.kind}`}
          key={anchor.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'anchor', id: anchor.id });
          }}
          role="button"
          tabIndex={0}
        >
          <circle cx={anchor.x} cy={anchor.y} r="25" fill="#ffcf5a" stroke="#1a1a1a" strokeWidth="6" />
          <text
            x={anchor.x}
            y={anchor.y + 8}
            fill="#1a1a1a"
            fontSize="24"
            fontWeight="900"
            textAnchor="middle"
          >
            {anchor.symbol}
          </text>
          <text
            x={anchor.x + 32}
            y={anchor.y - 28}
            fill="#1a1a1a"
            fontSize="21"
            fontWeight="800"
            paintOrder="stroke"
            stroke="#fbfbf9"
            strokeWidth="7"
          >
            {anchor.kind}
          </text>
        </g>
      ))}
    </g>
  );
}
