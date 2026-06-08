import { useCallback, useMemo, useState } from 'react';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageObject,
  type BridgeStageCompositionSource
} from '@/game/scenes/ridge/bridge/stageComposition';
import {
  cloneBridgeStageCompositionSource,
  formatStageAuthoringSnippet,
  resetStageAuthoringSelection,
  STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
  updateStageAuthoringDraft,
  type StageAuthoringSelection
} from '@/game/scenes/ridge/bridge/stageAuthoring';

export interface StageAuthoringTargetOption {
  label: string;
  selection: StageAuthoringSelection;
}

export interface StageAuthoringField {
  field: string;
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
}

export function useStageAuthoring() {
  const [active, setActive] = useState(false);
  const [draftSource, setDraftSource] = useState(() => cloneBridgeStageCompositionSource());
  const [selection, setSelection] = useState<StageAuthoringSelection | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const handlePick = useCallback((nextSelection: StageAuthoringSelection) => {
    setSelection(nextSelection);
  }, []);

  const setAuthoringActive = useCallback((nextActive: boolean) => {
    setActive(nextActive);
  }, []);

  const updateField = useCallback((field: string, value: number) => {
    if (!selection) return;
    setDraftSource((current) => updateStageAuthoringDraft(current, selection, field, value));
    setIsDirty(true);
  }, [selection]);

  const discardDraft = useCallback(() => {
    setDraftSource(cloneBridgeStageCompositionSource());
    setSelection(null);
    setIsDirty(false);
  }, []);

  const resetSelectionDraft = useCallback(() => {
    if (!selection) return;
    setDraftSource((current) => resetStageAuthoringSelection(
      BRIDGE_STAGE_SOURCE,
      current,
      selection
    ));
    setIsDirty(true);
  }, [selection]);

  const fields = useMemo(
    () => (selection ? getAuthoringFields(draftSource, selection) : []),
    [draftSource, selection]
  );

  const snippet = useMemo(
    () => (selection ? formatStageAuthoringSnippet(draftSource, selection) : ''),
    [draftSource, selection]
  );

  const selectionLabel = useMemo(
    () => (selection ? formatSelectionLabel(selection) : 'Select a target below or in the preview'),
    [selection]
  );

  const targetOptions = useMemo(
    () => getAuthoringTargetOptions(draftSource),
    [draftSource]
  );

  const resolveCompositionSource = useCallback((): BridgeStageCompositionSource | undefined => {
    if (!active && !isDirty) return undefined;
    return draftSource;
  }, [active, draftSource, isDirty]);

  return {
    active,
    discardDraft,
    draftSource,
    fields,
    handlePick,
    isDirty,
    resetSelectionDraft,
    resolveCompositionSource,
    selection,
    selectionLabel,
    setAuthoringActive,
    setSelection,
    snippet,
    targetOptions,
    updateField
  };
}

function getAuthoringTargetOptions(
  source: BridgeStageCompositionSource
): StageAuthoringTargetOption[] {
  const railPoints = source.primaryWalkRail.points.map((point, index) => ({
    label: `Rail point ${index} @ ${Math.round(point.x)}, ${Math.round(point.y)}`,
    selection: { kind: 'rail-point', index } as const
  }));
  const spots = source.spots.map((spot) => ({
    label: `Spot ${spot.id}`,
    selection: { kind: 'spot', id: spot.id } as const
  }));
  const objects = source.objects.map((object) => ({
    label: `Object ${object.id}`,
    selection: { kind: 'object', id: object.id } as const
  }));

  return [...railPoints, ...spots, ...objects];
}

function getAuthoringFields(
  source: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): StageAuthoringField[] {
  switch (selection.kind) {
    case 'rail-point': {
      const point = source.primaryWalkRail.points[selection.index];
      if (!point) return [];
      return [
        {
          field: 'x',
          label: 'x',
          min: source.canvas.x,
          max: source.canvas.x + source.canvas.width,
          step: 1,
          value: Math.round(point.x)
        },
        {
          field: 'y',
          label: 'y',
          min: source.canvas.y,
          max: source.canvas.y + source.canvas.height,
          step: 1,
          value: Math.round(point.y)
        }
      ];
    }
    case 'spot': {
      const spot = source.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return [];
      const offsetX = spot.offset?.x ?? 0;
      const offsetY = spot.offset?.y ?? 0;
      return [
        {
          field: 'railProgress',
          label: 'railProgress',
          min: 0,
          max: 1,
          step: 0.001,
          value: spot.railProgress
        },
        {
          field: 'offset.x',
          label: 'offset.x',
          min: offsetX - STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          max: offsetX + STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          step: 1,
          value: Math.round(offsetX)
        },
        {
          field: 'offset.y',
          label: 'offset.y',
          min: offsetY - STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          max: offsetY + STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          step: 1,
          value: Math.round(offsetY)
        }
      ];
    }
    case 'object': {
      const object = resolveBridgeStageObject(source, selection.id);
      const offsetX = object.offset?.x ?? 0;
      const offsetY = object.offset?.y ?? 0;
      return [
        {
          field: 'offset.x',
          label: 'offset.x',
          min: offsetX - STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          max: offsetX + STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          step: 1,
          value: Math.round(offsetX)
        },
        {
          field: 'offset.y',
          label: 'offset.y',
          min: offsetY - STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          max: offsetY + STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX,
          step: 1,
          value: Math.round(offsetY)
        }
      ];
    }
    default:
      return [];
  }
}

function formatSelectionLabel(selection: StageAuthoringSelection): string {
  switch (selection.kind) {
    case 'rail-point':
      return `Walk Rail point ${selection.index}`;
    case 'spot':
      return `Stage Spot ${selection.id}`;
    case 'object':
      return `Stage Object ${selection.id}`;
    default:
      return 'Selection';
  }
}
