import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRIDGE_STAGE_SOURCE } from '@/game/scenes/ridge/bridge/stageComposition';
import { cloneBridgeStageCompositionSource, updateStageAuthoringDraft } from '@/game/scenes/ridge/bridge/stageAuthoring';
import { patchBridgeStageCompositionSourceFile } from './patchBridgeStageCompositionSource';

describe('patchBridgeStageCompositionSourceFile', () => {
  it('replaces sync-marked sections with the authored draft values', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'ridge-stage-authoring-'));
    const filePath = join(tempDir, 'stageComposition.ts');
    writeFileSync(filePath, FIXTURE_SOURCE, 'utf8');

    const draft = updateStageAuthoringDraft(
      cloneBridgeStageCompositionSource(BRIDGE_STAGE_SOURCE),
      { kind: 'plate', id: 'cornfield-sky' },
      'y',
      -99
    );

    patchBridgeStageCompositionSourceFile(filePath, draft);
    const patched = readFileSync(filePath, 'utf8');

    expect(patched).toContain('y: -99');
    expect(patched).toContain('/* <stage-authoring-sync:plates> */');
    rmSync(tempDir, { recursive: true, force: true });
  });
});

const FIXTURE_SOURCE = `
export const BRIDGE_STAGE_SOURCE = {
  primaryWalkRail: {
    id: 'primary',
    /* <stage-authoring-sync:primary-walk-rail-points> */
    points: [
      { progress: 0, x: 1, y: 2, cue: { scale: 1, depth: 1, cameraFollowOffsetY: 0 } }
    ]
    /* </stage-authoring-sync:primary-walk-rail-points> */
  },
  /* <stage-authoring-sync:spots> */
  spots: [
    { id: 'spawn', railProgress: 0 }
  ],
  /* </stage-authoring-sync:spots> */
  plates: [
    /* <stage-authoring-sync:plates> */
    {
      id: 'cornfield-sky',
      textureKey: 'ridge-bridge-layered-cornfield-sky',
      x: 1,
      y: 2,
      depth: 1,
      origin: [0, 0],
      scale: 1
    }
    /* </stage-authoring-sync:plates> */
  ],
  /* <stage-authoring-sync:objects> */
  objects: [
    {
      id: 'bridge-draftsperson',
      kind: 'image',
      textureKey: 'ridge-bridge-builder',
      spotId: 'draftsperson',
      scale: 0.5
    }
  ],
  /* </stage-authoring-sync:objects> */
} as const;
`;
