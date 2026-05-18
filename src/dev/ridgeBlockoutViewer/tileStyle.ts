import type { RidgeViewerTileCell } from './model';

export function getTileFill(cell: RidgeViewerTileCell): string {
  if (cell.tile?.kind === 'solid') return '#1a1a1a';
  if (cell.tile?.kind === 'platform') return '#2d7db3';
  if (cell.tile?.kind === 'ladder') return '#8a63d2';
  if (cell.tile?.kind === 'anchor') return '#ffcf5a';
  if (cell.tile?.kind === 'design') return '#f0a7c8';
  return '#fbfbf9';
}

export function getTileOpacity(cell: RidgeViewerTileCell): number {
  if (cell.symbol === '.') return 0.18;
  if (cell.tile?.kind === 'design') return 0.35;
  if (cell.tile?.kind === 'anchor') return 0.5;
  return 0.7;
}
