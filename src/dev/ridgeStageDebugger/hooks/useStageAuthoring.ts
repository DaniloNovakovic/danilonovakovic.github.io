import { useCallback, useMemo, useState } from 'react';
import {
  BRIDGE_STAGE_SOURCE,
  type BridgeStageCompositionSource
} from '@/game/scenes/ridge/bridge/stageComposition';
import type { RidgeDevAuthoringDragRequest } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  applyStageAuthoringDrag,
  cloneBridgeStageCompositionSource,
  formatStageAuthoringSelectionLabel,
  formatStageAuthoringSnippet,
  listStageAuthoringFields,
  listStageAuthoringTargetOptions,
  resetStageAuthoringSelection,
  updateStageAuthoringDraft,
  type StageAuthoringField,
  type StageAuthoringSelection,
  type StageAuthoringTargetOption
} from '@/game/scenes/ridge/bridge/stageAuthoring';
import { RIDGE_STAGE_AUTHORING_COMMIT_PATH } from '@/dev/ridgeStageAuthoring/constants';

export type { StageAuthoringField, StageAuthoringTargetOption };

export function useStageAuthoring() {
  const [active, setActive] = useState(false);
  const [draftSource, setDraftSource] = useState(() => cloneBridgeStageCompositionSource());
  const [selection, setSelection] = useState<StageAuthoringSelection | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const handlePick = useCallback((nextSelection: StageAuthoringSelection) => {
    setSelection(nextSelection);
  }, []);

  const handleDrag = useCallback((request: RidgeDevAuthoringDragRequest) => {
    setDraftSource((current) => applyStageAuthoringDrag(
      current,
      request.selection,
      request.worldX,
      request.worldY,
      {
        offsetOnly: request.offsetOnly,
        dragAnchor: request.dragAnchor
      }
    ));
    setSelection(request.selection);
    setIsDirty(true);
    setCommitError(null);
  }, []);

  const setAuthoringActive = useCallback((nextActive: boolean) => {
    setActive(nextActive);
  }, []);

  const updateField = useCallback((field: string, value: number) => {
    if (!selection) return;
    setDraftSource((current) => updateStageAuthoringDraft(current, selection, field, value));
    setIsDirty(true);
    setCommitError(null);
  }, [selection]);

  const discardDraft = useCallback(() => {
    setDraftSource(cloneBridgeStageCompositionSource());
    setSelection(null);
    setIsDirty(false);
    setCommitError(null);
  }, []);

  const resetSelectionDraft = useCallback(() => {
    if (!selection) return;
    setDraftSource((current) => resetStageAuthoringSelection(
      BRIDGE_STAGE_SOURCE,
      current,
      selection
    ));
    setIsDirty(true);
    setCommitError(null);
  }, [selection]);

  const commitDraft = useCallback(async () => {
    if (!isDirty) return;

    setIsCommitting(true);
    setCommitError(null);

    try {
      const response = await fetch(RIDGE_STAGE_AUTHORING_COMMIT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: draftSource })
      });
      const payload = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? 'Stage authoring commit failed');
      }

      window.location.reload();
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : 'Stage authoring commit failed');
      setIsCommitting(false);
    }
  }, [draftSource, isDirty]);

  const fields = useMemo(
    () => (selection ? listStageAuthoringFields(draftSource, selection) : []),
    [draftSource, selection]
  );

  const snippet = useMemo(
    () => (selection ? formatStageAuthoringSnippet(draftSource, selection) : ''),
    [draftSource, selection]
  );

  const selectionLabel = useMemo(
    () => (selection ? formatStageAuthoringSelectionLabel(selection) : 'Select a target below or in the preview'),
    [selection]
  );

  const targetOptions = useMemo(
    () => listStageAuthoringTargetOptions(draftSource),
    [draftSource]
  );

  const resolveCompositionSource = useCallback((): BridgeStageCompositionSource | undefined => {
    if (!active && !isDirty) return undefined;
    return draftSource;
  }, [active, draftSource, isDirty]);

  return {
    active,
    commitDraft,
    commitError,
    discardDraft,
    draftSource,
    fields,
    handleDrag,
    handlePick,
    isCommitting,
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
