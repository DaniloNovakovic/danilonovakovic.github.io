import { describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import {
  DEV_RIDGE_STAMP_QUERY_PARAM,
  getDevRidgeProgressSeed
} from './devRidgeProgressParams';

describe('dev Ridge progress params', () => {
  it('derives a known Ridge stamp seed and marks the param for consumption', () => {
    const searchParams = new URLSearchParams(
      `${DEV_RIDGE_STAMP_QUERY_PARAM}=${STAMPEDE_SKETCH_RIDGE_STAMP_ID}&startScene=ridge`
    );

    expect(getDevRidgeProgressSeed(searchParams)).toEqual({
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID],
      consumedParams: [DEV_RIDGE_STAMP_QUERY_PARAM]
    });
    expect(searchParams.get(DEV_RIDGE_STAMP_QUERY_PARAM)).toBe(STAMPEDE_SKETCH_RIDGE_STAMP_ID);
  });

  it('ignores unknown Ridge stamp ids without consuming the param', () => {
    const searchParams = new URLSearchParams(
      `${DEV_RIDGE_STAMP_QUERY_PARAM}=future-stamp`
    );

    expect(getDevRidgeProgressSeed(searchParams)).toEqual({
      stampIds: [],
      consumedParams: []
    });
    expect(searchParams.get(DEV_RIDGE_STAMP_QUERY_PARAM)).toBe('future-stamp');
  });

  it('ignores absent Ridge stamp params', () => {
    expect(getDevRidgeProgressSeed(new URLSearchParams('startScene=ridge'))).toEqual({
      stampIds: [],
      consumedParams: []
    });
  });
});
