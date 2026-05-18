import type { PointerEventHandler, RefObject, WheelEventHandler } from 'react';
import type { RidgeDevPlayerSnapshot } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import { ModelToolbar } from './components/ModelToolbar';
import type { RidgeBlockoutViewerModel } from './model';
import type { LayerState, ModelViewport, Selection } from './types';
import { AnchorLayer } from './svgLayers/AnchorLayer';
import { AssistZoneLayer } from './svgLayers/AssistZoneLayer';
import { ColliderLayer } from './svgLayers/ColliderLayer';
import { GridLayer } from './svgLayers/GridLayer';
import { PlayerSnapshotLayer } from './svgLayers/PlayerSnapshotLayer';
import { RectLayer } from './svgLayers/RectLayer';
import { RoomLayer } from './svgLayers/RoomLayer';
import { RouteLayer } from './svgLayers/RouteLayer';
import { ShortcutLayer } from './svgLayers/ShortcutLayer';

export function ModelCanvas({
  layers,
  model,
  onFocusRoom,
  onPointerDown,
  onPointerMove,
  onResetView,
  onSelect,
  onStopDragging,
  onWheel,
  onZoomIn,
  onZoomOut,
  playerSnapshot,
  svgRef,
  transform,
  view,
  worldRef
}: {
  layers: LayerState;
  model: RidgeBlockoutViewerModel;
  onFocusRoom: (roomId: string) => void;
  onPointerDown: PointerEventHandler<SVGSVGElement>;
  onPointerMove: PointerEventHandler<SVGSVGElement>;
  onResetView: () => void;
  onSelect: (selection: Selection) => void;
  onStopDragging: () => void;
  onWheel: WheelEventHandler<SVGSVGElement>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  playerSnapshot: RidgeDevPlayerSnapshot | null;
  svgRef: RefObject<SVGSVGElement | null>;
  transform: string;
  view: ModelViewport;
  worldRef: RefObject<SVGGElement | null>;
}) {
  return (
    <section className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fdfcf7] shadow-[7px_7px_0_rgba(26,26,26,1)]">
      <ModelToolbar
        zoom={view.zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onResetView}
      />
      <svg
        ref={svgRef}
        aria-label="Ridge blockout model canvas"
        className="h-full min-h-0 w-full cursor-grab touch-none bg-[#fbfbf9]"
        data-testid="ridge-blockout-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onStopDragging}
        onPointerCancel={onStopDragging}
        onWheel={onWheel}
        role="img"
      >
        <defs>
          <pattern id="ridge-viewer-paper-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d8d0bf" strokeWidth="2" />
          </pattern>
        </defs>
        <g ref={worldRef} data-testid="ridge-viewer-world" transform={transform}>
          <rect
            x={model.bounds.x}
            y={model.bounds.y}
            width={model.bounds.width}
            height={model.bounds.height}
            fill="url(#ridge-viewer-paper-grid)"
            stroke="#1a1a1a"
            strokeWidth="8"
          />
          {layers.grid ? <GridLayer cells={model.gridCells} /> : null}
          {layers.rects ? <RectLayer rects={model.rects} onSelect={onSelect} /> : null}
          {layers.rooms ? (
            <RoomLayer
              rooms={model.rooms}
              onFocusRoom={onFocusRoom}
              onSelect={onSelect}
            />
          ) : null}
          {layers.routes ? <RouteLayer routes={model.routes} onSelect={onSelect} /> : null}
          {layers.futureRoutes ? (
            <RouteLayer routes={model.futureRoutes} onSelect={onSelect} future />
          ) : null}
          {layers.shortcuts ? (
            <ShortcutLayer shortcuts={model.shortcuts} onSelect={onSelect} />
          ) : null}
          {layers.colliders ? (
            <ColliderLayer colliders={model.colliders} onSelect={onSelect} />
          ) : null}
          {layers.assistZones ? <AssistZoneLayer model={model} /> : null}
          {layers.anchors ? <AnchorLayer anchors={model.anchors} onSelect={onSelect} /> : null}
          {playerSnapshot ? <PlayerSnapshotLayer snapshot={playerSnapshot} /> : null}
        </g>
      </svg>
    </section>
  );
}
