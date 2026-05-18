import type { RidgeDevPlayerSnapshot } from '@/game/scenes/ridge/runtime/ridgeDevControls';

export function PlayerSnapshotLayer({ snapshot }: { snapshot: RidgeDevPlayerSnapshot }) {
  return (
    <g data-testid="ridge-layer-player-snapshot" pointerEvents="none">
      <circle
        cx={snapshot.x}
        cy={snapshot.y}
        fill="#f3df8b"
        r="22"
        stroke="#1a1a1a"
        strokeWidth="6"
      />
      <line
        x1={snapshot.x - 34}
        x2={snapshot.x + 34}
        y1={snapshot.y}
        y2={snapshot.y}
        stroke="#1a1a1a"
        strokeWidth="5"
      />
      <line
        x1={snapshot.x}
        x2={snapshot.x}
        y1={snapshot.y - 34}
        y2={snapshot.y + 34}
        stroke="#1a1a1a"
        strokeWidth="5"
      />
      <text
        x={snapshot.x + 34}
        y={snapshot.y - 28}
        fill="#1a1a1a"
        fontSize="21"
        fontWeight="900"
        paintOrder="stroke"
        stroke="#fbfbf9"
        strokeWidth="7"
      >
        player
      </text>
    </g>
  );
}
