import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';

export const DEV_RIDGE_STAMP_QUERY_PARAM = 'devRidgeStamp';

export const DEV_RIDGE_STAMP_IDS = [
  STAMPEDE_SKETCH_RIDGE_STAMP_ID
] as const;

export type DevRidgeStampId = (typeof DEV_RIDGE_STAMP_IDS)[number];

export interface DevRidgeProgressSeed {
  stampIds: readonly DevRidgeStampId[];
  consumedParams: readonly string[];
}

export function getDevRidgeProgressSeed(
  searchParams: Pick<URLSearchParams, 'get'>
): DevRidgeProgressSeed {
  const stampId = searchParams.get(DEV_RIDGE_STAMP_QUERY_PARAM);
  if (!stampId || !isDevRidgeStampId(stampId)) {
    return {
      stampIds: [],
      consumedParams: []
    };
  }

  return {
    stampIds: [stampId],
    consumedParams: [DEV_RIDGE_STAMP_QUERY_PARAM]
  };
}

function isDevRidgeStampId(stampId: string): stampId is DevRidgeStampId {
  return (DEV_RIDGE_STAMP_IDS as readonly string[]).includes(stampId);
}
