import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ModelCanvas } from './ModelCanvas';
import {
  RidgeRuntimePreview,
  type RidgePreviewInputOwner
} from './RidgeRuntimePreview';
import { RidgeViewerHeader } from './RidgeViewerHeader';
import { useModelViewport } from './hooks/useModelViewport';
import { useRidgePreviewControls } from './hooks/useRidgePreviewControls';
import { useRidgeViewerLayers } from './hooks/useRidgeViewerLayers';
import { useRidgeViewerView } from './hooks/useRidgeViewerView';
import { createRidgeBlockoutViewerModel } from './model';
import { findViewerRoomForPoint } from './modelViewport';
import { PreviewPanel } from './panels/PreviewPanel';
import { LayerPanel } from './panels/LayerPanel';
import { RoomFocusPanel } from './panels/RoomFocusPanel';
import { RoutePanel } from './panels/RoutePanel';
import { SelectionPanel } from './panels/SelectionPanel';
import { SummaryPanel } from './panels/SummaryPanel';
import { getSelectionDetails } from './selectionDetails';
import { getTeleportGroups } from './teleportTargets';
import type { Selection } from './types';

export default function RidgeBlockoutViewer() {
  const model = useMemo(() => createRidgeBlockoutViewerModel(), []);
  const { activeView, switchView } = useRidgeViewerView();
  const { layers, toggleLayer } = useRidgeViewerLayers();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [previewInputOwner, setPreviewInputOwner] = useState<RidgePreviewInputOwner>('game');
  const [hasPreviewMounted, setHasPreviewMounted] = useState(activeView === 'preview');
  const pendingModelFocusRoomIdRef = useRef<string | null>(null);
  const modelViewport = useModelViewport(model.rooms);
  const previewControls = useRidgePreviewControls();
  const selectedDetails = selection ? getSelectionDetails(model, selection) : null;
  const teleportGroups = useMemo(() => getTeleportGroups(model), [model]);
  const claimPanelInput = useCallback(() => setPreviewInputOwner('panel'), []);
  const claimGameInput = useCallback(() => setPreviewInputOwner('game'), []);
  const switchViewerView = useCallback((nextView: 'preview' | 'model') => {
    if (nextView === 'preview') {
      setHasPreviewMounted(true);
    }
    if (nextView === 'model' && activeView === 'preview' && previewControls.playerSnapshot) {
      pendingModelFocusRoomIdRef.current =
        findViewerRoomForPoint(model.rooms, previewControls.playerSnapshot)?.id ?? null;
    }
    switchView(nextView);
  }, [activeView, model.rooms, previewControls.playerSnapshot, switchView]);

  useEffect(() => {
    if (activeView !== 'model') return;
    const roomId = pendingModelFocusRoomIdRef.current;
    if (!roomId) return;

    pendingModelFocusRoomIdRef.current = null;
    requestAnimationFrame(() => {
      modelViewport.focusRoom(roomId);
    });
  }, [activeView, modelViewport]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a1a1a]">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 lg:p-3">
        <div onFocusCapture={claimPanelInput} onPointerDownCapture={claimPanelInput}>
          <RidgeViewerHeader
            activeView={activeView}
            model={model}
            onSwitchView={switchViewerView}
          />
        </div>

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(220px,35dvh)] gap-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-none">
          <div className="relative h-full min-h-0 min-w-0">
            {hasPreviewMounted ? (
              <div className="absolute inset-0">
                <RidgeRuntimePreview
                  inputOwner={previewInputOwner}
                  isActive={activeView === 'preview'}
                  onClaimGameInput={claimGameInput}
                  previewZoom={previewControls.previewZoom}
                  ridgeDevControls={previewControls.ridgeDevControls}
                />
              </div>
            ) : null}
            {activeView === 'model' ? (
              <div
                className="absolute inset-0 h-full min-h-0 min-w-0"
                onFocusCapture={claimPanelInput}
                onPointerDownCapture={claimPanelInput}
              >
                <ModelCanvas
                  layers={layers}
                  model={model}
                  onFocusRoom={modelViewport.focusRoom}
                  onPointerDown={modelViewport.handlePointerDown}
                  onPointerMove={modelViewport.handlePointerMove}
                  onResetView={modelViewport.resetView}
                  onSelect={setSelection}
                  onStopDragging={modelViewport.stopDragging}
                  onWheel={modelViewport.handleWheel}
                  onZoomIn={() => modelViewport.adjustZoom(0.02)}
                  onZoomOut={() => modelViewport.adjustZoom(-0.02)}
                  playerSnapshot={previewControls.playerSnapshot}
                  svgRef={modelViewport.svgRef}
                  transform={modelViewport.transform}
                  view={modelViewport.view}
                  worldRef={modelViewport.worldRef}
                />
              </div>
            ) : null}
          </div>

          <aside
            className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 shadow-[7px_7px_0_rgba(26,26,26,1)]"
            onFocusCapture={claimPanelInput}
            onPointerDownCapture={claimPanelInput}
          >
            <SummaryPanel model={model} />
            {activeView === 'preview' ? (
              <PreviewPanel
                debugSettings={previewControls.debugSettings}
                lastTeleportLabel={previewControls.lastTeleportLabel}
                onPreviewZoomChange={previewControls.setPreviewZoomLevel}
                onPreviewZoomIn={() => previewControls.adjustPreviewZoom(0.25)}
                onPreviewZoomOut={() => previewControls.adjustPreviewZoom(-0.25)}
                onResetPlayer={previewControls.requestPlayerReset}
                onToggleDebugSetting={previewControls.toggleDebugSetting}
                onTeleport={previewControls.requestTeleport}
                playerSnapshot={previewControls.playerSnapshot}
                previewZoom={previewControls.previewZoom}
                teleportGroups={teleportGroups}
              />
            ) : (
              <>
                <RoomFocusPanel model={model} onFocusRoom={modelViewport.focusRoom} />
                <LayerPanel layers={layers} onToggle={toggleLayer} />
                <RoutePanel model={model} />
                <SelectionPanel details={selectedDetails} />
              </>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
