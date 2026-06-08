import { describe, expect, it } from 'vitest';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageObjectPlacement,
  sampleBridgeWalkRail
} from './stageComposition';
import {
  advanceStageAuthoringPointer,
  applyStageAuthoringDrag,
  areStageAuthoringSelectionsEqual,
  beginStageAuthoringPointer,
  clampStageAuthoringOffset,
  cloneBridgeStageCompositionSource,
  finishStageAuthoringPointer,
  formatStageAuthoringSnippet,
  hitTestStageAuthoringTargets,
  isWorldPointInsideCameraView,
  resetStageAuthoringSelection,
  STAGE_AUTHORING_OFFSET_LIMIT_PX,
  STAGE_AUTHORING_DRAG_THRESHOLD_PX,
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

  it('projects spot drags to the rail and keeps rail progress fixed for shift drags', () => {
    const draft = applyStageAuthoringDrag(
      cloneBridgeStageCompositionSource(),
      { kind: 'spot', id: 'draftsperson' },
      900,
      500
    );
    const shifted = applyStageAuthoringDrag(
      cloneBridgeStageCompositionSource(),
      { kind: 'spot', id: 'draftsperson' },
      900,
      500,
      { offsetOnly: true }
    );
    const spot = draft.spots.find((candidate) => candidate.id === 'draftsperson');
    const shiftedSpot = shifted.spots.find((candidate) => candidate.id === 'draftsperson');
    const committed = BRIDGE_STAGE_SOURCE.spots.find((candidate) => candidate.id === 'draftsperson');

    expect(spot?.railProgress).not.toBe(committed?.railProgress);
    expect(shiftedSpot?.railProgress).toBe(committed?.railProgress);
    const railPoint = sampleBridgeWalkRail(
      BRIDGE_STAGE_SOURCE.primaryWalkRail,
      committed?.railProgress ?? 0
    );
    expect(shiftedSpot?.offset).toEqual({
      x: 900 - railPoint.x,
      y: 500 - railPoint.y
    });
  });

  it('checks whether a world point is inside the camera view with margin', () => {
    expect(isWorldPointInsideCameraView(
      { x: 100, y: 100, right: 500, bottom: 400 },
      { x: 200, y: 200 }
    )).toBe(true);
    expect(isWorldPointInsideCameraView(
      { x: 100, y: 100, right: 500, bottom: 400 },
      { x: 20, y: 120 }
    )).toBe(false);
  });

  it('clamps authored spot offsets to a sane pixel window', () => {
    const draft = updateStageAuthoringDraft(
      cloneBridgeStageCompositionSource(),
      { kind: 'spot', id: 'draftsperson' },
      'offset.y',
      -25000
    );
    const spot = draft.spots.find((candidate) => candidate.id === 'draftsperson');

    expect(spot?.offset?.y).toBe(-STAGE_AUTHORING_OFFSET_LIMIT_PX);
    expect(clampStageAuthoringOffset(25000)).toBe(STAGE_AUTHORING_OFFSET_LIMIT_PX);
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

  it('compares selections with serialized keys', () => {
    expect(areStageAuthoringSelectionsEqual(
      { kind: 'spot', id: 'draftsperson' },
      { kind: 'spot', id: 'draftsperson' }
    )).toBe(true);
    expect(areStageAuthoringSelectionsEqual(
      { kind: 'spot', id: 'draftsperson' },
      { kind: 'object', id: 'bridge-draftsperson' }
    )).toBe(false);
  });

  it('steps the authoring pointer FSM from pending click to pick', () => {
    const pending = beginStageAuthoringPointer({
      hit: { kind: 'spot', id: 'draftsperson' },
      offsetOnly: false,
      scrollX: 0,
      scrollY: 0,
      pointerX: 10,
      pointerY: 10
    });
    const finished = finishStageAuthoringPointer(pending);

    expect(finished.intents).toEqual([
      { kind: 'pick', selection: { kind: 'spot', id: 'draftsperson' } }
    ]);
    expect(finished.state.mode).toBe('idle');
  });

  it('promotes pending drags past the threshold into drag intents', () => {
    const pending = beginStageAuthoringPointer({
      hit: { kind: 'rail-point', index: 2 },
      offsetOnly: true,
      scrollX: 0,
      scrollY: 0,
      pointerX: 0,
      pointerY: 0
    });
    const moved = advanceStageAuthoringPointer(pending, {
      pointerX: STAGE_AUTHORING_DRAG_THRESHOLD_PX + 2,
      pointerY: 0,
      worldX: 520,
      worldY: 500,
      zoom: 1
    });

    expect(moved.state.mode).toBe('drag-marker');
    expect(moved.intents).toEqual([
      { kind: 'pick', selection: { kind: 'rail-point', index: 2 } },
      {
        kind: 'drag',
        selection: { kind: 'rail-point', index: 2 },
        worldX: 520,
        worldY: 500,
        offsetOnly: true
      }
    ]);
  });
});
