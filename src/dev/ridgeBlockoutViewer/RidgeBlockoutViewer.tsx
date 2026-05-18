import { useMemo, useState } from 'react';
import { ModelCanvas } from './ModelCanvas';
import { RidgeRuntimePreview } from './RidgeRuntimePreview';
import { RidgeViewerHeader } from './RidgeViewerHeader';
import { useModelViewport } from './hooks/useModelViewport';
import { useRidgePreviewControls } from './hooks/useRidgePreviewControls';
import { useRidgeViewerLayers } from './hooks/useRidgeViewerLayers';
import { useRidgeViewerView } from './hooks/useRidgeViewerView';
import { createRidgeBlockoutViewerModel } from './model';
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
  const modelViewport = useModelViewport(model.rooms);
  const previewControls = useRidgePreviewControls();
  const selectedDetails = selection ? getSelectionDetails(model, selection) : null;
  const teleportGroups = useMemo(() => getTeleportGroups(model), [model]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a1a1a]">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 lg:p-3">
        <RidgeViewerHeader
          activeView={activeView}
          model={model}
          onSwitchView={switchView}
        />

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(220px,35dvh)] gap-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-none">
          {activeView === 'preview' ? (
            <RidgeRuntimePreview
              previewZoom={previewControls.previewZoom}
              ridgeDevControls={previewControls.ridgeDevControls}
            />
          ) : (
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
          )}

          <aside className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 shadow-[7px_7px_0_rgba(26,26,26,1)]">
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
