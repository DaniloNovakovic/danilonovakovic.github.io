export const RIDGE_BLOCKOUT_LADDER_SYMBOL = 'L';

export const RIDGE_BLOCKOUT_TRAVERSAL_MOVEMENTS = new Set([
  'ramp',
  'jump',
  'climb',
  'drop'
]);

export type RidgeBlockoutTraversalMovement =
  | 'ramp'
  | 'jump'
  | 'climb'
  | 'drop';
