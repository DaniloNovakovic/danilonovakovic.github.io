import type { RidgeViewerTileCell } from '../model';
import { getTileFill, getTileOpacity } from '../tileStyle';

export function GridLayer({ cells }: { cells: readonly RidgeViewerTileCell[] }) {
  return (
    <g data-testid="ridge-layer-grid">
      {cells.map((cell) => (
        <rect
          key={cell.id}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          fill={getTileFill(cell)}
          opacity={getTileOpacity(cell)}
          stroke={cell.symbol === '.' ? 'none' : '#1a1a1a'}
          strokeWidth={cell.symbol === '.' ? 0 : 1.5}
        />
      ))}
    </g>
  );
}
