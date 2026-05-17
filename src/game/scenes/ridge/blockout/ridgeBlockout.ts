import ridgeBlockoutSource from './maps/folded-desk-ridge.blockout.txt?raw';
import { parseRidgeBlockout } from './parser';

export const RIDGE_BLOCKOUT_SOURCE = ridgeBlockoutSource;
export const RIDGE_BLOCKOUT = parseRidgeBlockout(RIDGE_BLOCKOUT_SOURCE);
