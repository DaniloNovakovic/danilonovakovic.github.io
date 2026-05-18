import type { Selection } from '../types';

export function ColliderLayer({
  colliders,
  onSelect
}: {
  colliders: readonly { id: string; x: number; y: number; width: number; height: number; kind: string }[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-colliders">
      {colliders.map((collider) => (
        <rect
          aria-label={`Collider ${collider.id}`}
          fill={collider.kind === 'solid' ? '#1a1a1a' : '#2d7db3'}
          fillOpacity={collider.kind === 'solid' ? 0.32 : 0.38}
          height={collider.height}
          key={collider.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'collider', id: collider.id });
          }}
          role="button"
          stroke="#1a1a1a"
          strokeWidth="3"
          tabIndex={0}
          width={collider.width}
          x={collider.x - collider.width / 2}
          y={collider.y - collider.height / 2}
        />
      ))}
    </g>
  );
}
