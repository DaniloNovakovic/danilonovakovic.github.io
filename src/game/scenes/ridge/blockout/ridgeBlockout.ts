import ridgeBlockoutSource from '../../../../../docs/game-design/ridge.blockout.txt?raw';
import { parseRidgeBlockout } from './parser';

export const RIDGE_BLOCKOUT_SOURCE = ridgeBlockoutSource;
export const RIDGE_BLOCKOUT = parseRidgeBlockout(RIDGE_BLOCKOUT_SOURCE);
