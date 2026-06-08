import { describe, expect, it } from 'vitest';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageObjectPlacement
} from './stageComposition';
import {
  cloneBridgeStageCompositionSource,
  formatStageAuthoringSnippet,
  hitTestStageAuthoringTargets,
  resetStageAuthoringSelection,
  updateStageAuthoringDraft
} from './stageAuthoring';

describe('stageAuthoring', () => {
  it('clones the Bridge Stage Composition Source for draft editing', () => {
    const draft = cloneBridgeStageCompositionSource();
    draft.primaryWalkRail.points[0]!.x = 999;

    expect(BRIDGE_STAGE_SOURCE.primaryWalkRail.points[0]?.x).not.toBe(999);
    expect(draft.primaryWalkRail.points[0]?.x).toBe(999);
  });

  it('prefers the closest Stage Object pick over overlapping spot and rail markers', () => {
    const builder = resolveBridgeStageObjectPlacement(BRIDGE_STAGE_SOURCE, 'bridge-draftsperson');
    const pick = hitTestStageAuthoringTargets(
      BRIDGE_STAGE_SOURCE,
      builder.contactPoint.x,
      builder.contactPoint.y
    );

    expect(pick).toEqual({ kind: 'object', id: 'bridge-draftsperson' });
  });

  it('updates draft spot offsets and formats a full replacement snippet', () => {
    const draft = updateStageAuthoringDraft(
      cloneBridgeStageCompositionSource(),
      { kind: 'spot', id: 'draftsperson' },
      'offset.y',
      -6
    );
    const spot = draft.spots.find((candidate) => candidate.id === 'draftsperson');

    expect(spot?.offset).toEqual({ x: 0, y: -6 });
    expect(formatStageAuthoringSnippet(draft, { kind: 'spot', id: 'draftsperson' })).toContain(
      "id: 'draftsperson'"
    );
    expect(formatStageAuthoringSnippet(draft, { kind: 'spot', id: 'draftsperson' })).toContain(
      'offset: { x: 0, y: -6 }'
    );
  });

  it('resets only the selected draft entry back to the committed source', () => {
    const draft = updateStageAuthoringDraft(
      cloneBridgeStageCompositionSource(),
      { kind: 'spot', id: 'draftsperson' },
      'offset.y',
      -6
    );
    const reset = resetStageAuthoringSelection(
      BRIDGE_STAGE_SOURCE,
      draft,
      { kind: 'spot', id: 'draftsperson' }
    );
    const spot = reset.spots.find((candidate) => candidate.id === 'draftsperson');

    expect(spot?.offset).toBeUndefined();
  });
});
