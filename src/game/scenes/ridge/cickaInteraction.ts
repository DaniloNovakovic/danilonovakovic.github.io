import type { RidgeWorldMemory, RidgeWorldMemoryId } from './worldMemory';

export const CICKA_INTERACTION_TARGET_ID = 'cicka-perch' as const;
export const CICKA_INTERACTION_RESPONSE_DURATION_MS = 2600;

export type CickaInteractionResponseId = 'fresh' | 'stampede-memory';

export interface CickaInteractionCopy {
  fresh: string;
  stampedeMemory: string;
}

export interface CickaInteractionResponse {
  id: CickaInteractionResponseId;
  line: string;
}

export function shouldShowCickaInteractionPrompt(input: {
  activeTargetId: string | null;
  responseVisible: boolean;
}): boolean {
  return input.activeTargetId !== CICKA_INTERACTION_TARGET_ID || !input.responseVisible;
}

export function getCickaInteractionResponse(
  memories: readonly Pick<RidgeWorldMemory, 'id'>[],
  copy: CickaInteractionCopy
): CickaInteractionResponse {
  if (hasMemory(memories, 'cicka-stampede-note')) {
    return {
      id: 'stampede-memory',
      line: copy.stampedeMemory
    };
  }

  return {
    id: 'fresh',
    line: copy.fresh
  };
}

function hasMemory(
  memories: readonly Pick<RidgeWorldMemory, 'id'>[],
  memoryId: RidgeWorldMemoryId
): boolean {
  return memories.some((memory) => memory.id === memoryId);
}
