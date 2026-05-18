import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type WheelEvent
} from 'react';
import {
  Crosshair,
  Eye,
  LocateFixed,
  Map,
  Minus,
  Plus,
  RotateCcw
} from 'lucide-react';
import Game from '@/game/shell/Game';
import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type {
  RidgeDevControls,
  RidgeDevPlayerSnapshot,
  RidgeDevTeleportRequest
} from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  createRidgeBlockoutViewerModel,
  type RidgeBlockoutViewerModel,
  type RidgeViewerAnchor,
  type RidgeViewerLayerId,
  type RidgeViewerRect,
  type RidgeViewerRoom,
  type RidgeViewerRouteLink,
  type RidgeViewerShortcut,
  type RidgeViewerTileCell
} from './model';

type Selection =
  | { type: 'room'; id: string }
  | { type: 'anchor'; id: string }
  | { type: 'route'; id: string }
  | { type: 'futureRoute'; id: string }
  | { type: 'shortcut'; id: string }
  | { type: 'collider'; id: string }
  | { type: 'rect'; id: string };

type LayerState = Record<RidgeViewerLayerId, boolean>;
type ViewerView = 'preview' | 'model';

const INITIAL_VIEW = {
  zoom: 0.12,
  panX: 42,
  panY: 30
};
const INITIAL_PREVIEW_ZOOM = 1;
const PREVIEW_ZOOM_OPTIONS = [0.65, 0.75, 1, 1.25, 1.5, 1.6] as const;
const PLAYER_SNAPSHOT_RENDER_INTERVAL_MS = 250;

const DEFAULT_LAYERS: LayerState = {
  grid: true,
  rooms: true,
  anchors: true,
  routes: true,
  futureRoutes: true,
  shortcuts: true,
  colliders: true,
  assistZones: true,
  rects: true
};

const LAYER_LABELS: Record<RidgeViewerLayerId, string> = {
  grid: 'Grid',
  rooms: 'Rooms',
  anchors: 'Anchors',
  routes: 'Routes',
  futureRoutes: 'Future routes',
  shortcuts: 'Shortcuts',
  colliders: 'Colliders',
  assistZones: 'Assist zones',
  rects: 'Rects'
};

export default function RidgeBlockoutViewer() {
  const model = useMemo(() => createRidgeBlockoutViewerModel(), []);
  const [activeView, setActiveView] = useState<ViewerView>(() => readInitialViewerView());
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [view, setView] = useState(INITIAL_VIEW);
  const [previewZoom, setPreviewZoom] = useState(INITIAL_PREVIEW_ZOOM);
  const [lastTeleportLabel, setLastTeleportLabel] = useState<string | null>(null);
  const [playerSnapshot, setPlayerSnapshot] = useState<RidgeDevPlayerSnapshot | null>(null);
  const viewRef = useRef(INITIAL_VIEW);
  const previewZoomRef = useRef(INITIAL_PREVIEW_ZOOM);
  const teleportRequestRef = useRef<RidgeDevTeleportRequest | null>(null);
  const teleportSequenceRef = useRef(0);
  const lastPlayerSnapshotRenderAtRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);

  const selectedDetails = selection ? getSelectionDetails(model, selection) : null;
  const transform = getWorldTransform(view);
  const teleportGroups = useMemo(() => getTeleportGroups(model), [model]);

  useEffect(() => {
    previewZoomRef.current = previewZoom;
  }, [previewZoom]);

  const ridgeDevControls = useMemo<RidgeDevControls>(() => ({
    resolveCameraZoom: () => previewZoomRef.current,
    consumeTeleportRequest: () => {
      const request = teleportRequestRef.current;
      teleportRequestRef.current = null;
      return request;
    },
    publishPlayerSnapshot: (snapshot) => {
      const now = Date.now();
      if (now - lastPlayerSnapshotRenderAtRef.current < PLAYER_SNAPSHOT_RENDER_INTERVAL_MS) return;
      lastPlayerSnapshotRenderAtRef.current = now;
      setPlayerSnapshot(snapshot);
    }
  }), []);

  const toggleLayer = (layerId: RidgeViewerLayerId) => {
    setLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  };
  const switchView = (nextView: ViewerView) => {
    setActiveView(nextView);
    writeViewerViewToUrl(nextView);
  };
  const adjustZoom = (delta: number) => {
    setView((current) => {
      const nextView = { ...current, zoom: clampModelZoom(current.zoom + delta) };
      viewRef.current = nextView;
      return nextView;
    });
  };
  const adjustPreviewZoom = (delta: number) => {
    setPreviewZoom((current) => clampPreviewZoom(current + delta));
  };
  const setPreviewZoomLevel = (zoom: number) => {
    setPreviewZoom(clampPreviewZoom(zoom));
  };
  const resetView = () => {
    viewRef.current = INITIAL_VIEW;
    setView(INITIAL_VIEW);
  };
  const focusRoom = useCallback((roomId: string) => {
    const room = model.rooms.find((candidate) => candidate.id === roomId);
    if (!room) return;

    const viewportWidth = svgRef.current?.clientWidth || 1000;
    const viewportHeight = svgRef.current?.clientHeight || 700;
    const padding = 180;
    const nextZoom = clampModelZoom(
      Math.min(
        viewportWidth / (room.width + padding),
        viewportHeight / (room.height + padding)
      )
    );
    const nextView = {
      zoom: nextZoom,
      panX: roundForTransform(viewportWidth / 2 - (room.x + room.width / 2) * nextZoom),
      panY: roundForTransform(viewportHeight / 2 - (room.y + room.height / 2) * nextZoom)
    };
    viewRef.current = nextView;
    worldRef.current?.setAttribute('transform', getWorldTransform(nextView));
    setView(nextView);
  }, [model.rooms]);
  const requestTeleport = (anchor: RidgeViewerAnchor) => {
    const request = {
      sequence: ++teleportSequenceRef.current,
      label: getTeleportAnchorLabel(anchor),
      x: anchor.x,
      y: anchor.y,
      applySpawnOffset: true
    };
    teleportRequestRef.current = request;
    setLastTeleportLabel(request.label);
  };
  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? 0.02 : -0.02);
  };
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStartRef.current) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    const nextView = {
      ...viewRef.current,
      panX: roundForTransform(viewRef.current.panX + dx),
      panY: roundForTransform(viewRef.current.panY + dy)
    };
    viewRef.current = nextView;
    worldRef.current?.setAttribute('transform', getWorldTransform(nextView));
  };
  const stopDragging = () => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setView(viewRef.current);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a1a1a]">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 lg:p-3">
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-[3px] border-[#1a1a1a] bg-[#fbfbf9] px-3 py-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#5a554f]">
              Dev QA
            </p>
            <h1 className="text-sm font-black uppercase tracking-wider sm:text-base">
              Ridge Blockout Viewer
            </h1>
            <span className="min-w-0 truncate font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a554f]">
              {model.title}
            </span>
            <span
              className={[
                'border-2 border-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest',
                model.validationErrors.length === 0 ? 'bg-[#d7f2d1]' : 'bg-[#ffd6d1]'
              ].join(' ')}
              data-testid="ridge-viewer-header-validation-status"
            >
              {model.validationErrors.length === 0 ? 'Clean' : 'Errors'}
            </span>
          </div>
          <div className="flex border-2 border-[#1a1a1a] bg-[#e7dfcf] p-1" aria-label="Ridge viewer view">
            <ViewTab
              active={activeView === 'preview'}
              icon={<Eye className="h-4 w-4" aria-hidden />}
              label="Preview"
              onClick={() => switchView('preview')}
            />
            <ViewTab
              active={activeView === 'model'}
              icon={<Map className="h-4 w-4" aria-hidden />}
              label="Model"
              onClick={() => switchView('model')}
            />
          </div>
        </header>

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(220px,35dvh)] gap-2 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-none">
          {activeView === 'preview' ? (
            <RidgeRuntimePreview
              previewZoom={previewZoom}
              ridgeDevControls={ridgeDevControls}
            />
          ) : (
            <section className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fdfcf7] shadow-[7px_7px_0_rgba(26,26,26,1)]">
              <Toolbar
                zoom={view.zoom}
                onZoomIn={() => adjustZoom(0.02)}
                onZoomOut={() => adjustZoom(-0.02)}
                onReset={resetView}
              />
              <svg
                ref={svgRef}
                aria-label="Ridge blockout model canvas"
                className="h-full min-h-0 w-full cursor-grab touch-none bg-[#fbfbf9]"
                data-testid="ridge-blockout-svg"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onWheel={handleWheel}
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
                  {layers.rects ? <RectLayer rects={model.rects} onSelect={setSelection} /> : null}
                  {layers.rooms ? (
                    <RoomLayer
                      rooms={model.rooms}
                      onFocusRoom={focusRoom}
                      onSelect={setSelection}
                    />
                  ) : null}
                  {layers.routes ? <RouteLayer routes={model.routes} onSelect={setSelection} /> : null}
                  {layers.futureRoutes ? (
                    <RouteLayer routes={model.futureRoutes} onSelect={setSelection} future />
                  ) : null}
                  {layers.shortcuts ? (
                    <ShortcutLayer shortcuts={model.shortcuts} onSelect={setSelection} />
                  ) : null}
                  {layers.colliders ? (
                    <ColliderLayer colliders={model.colliders} onSelect={setSelection} />
                  ) : null}
                  {layers.assistZones ? <AssistZoneLayer model={model} /> : null}
                  {layers.anchors ? <AnchorLayer anchors={model.anchors} onSelect={setSelection} /> : null}
                  {playerSnapshot ? <PlayerSnapshotLayer snapshot={playerSnapshot} /> : null}
                </g>
              </svg>
            </section>
          )}

          <aside className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 shadow-[7px_7px_0_rgba(26,26,26,1)]">
            <SummaryPanel model={model} />
            {activeView === 'preview' ? (
              <PreviewPanel
                lastTeleportLabel={lastTeleportLabel}
                onPreviewZoomChange={setPreviewZoomLevel}
                onPreviewZoomIn={() => adjustPreviewZoom(0.25)}
                onPreviewZoomOut={() => adjustPreviewZoom(-0.25)}
                onTeleport={requestTeleport}
                playerSnapshot={playerSnapshot}
                previewZoom={previewZoom}
                teleportGroups={teleportGroups}
              />
            ) : (
              <>
                <RoomFocusPanel model={model} onFocusRoom={focusRoom} />
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

function RidgeRuntimePreview({
  previewZoom,
  ridgeDevControls
}: {
  previewZoom: number;
  ridgeDevControls: RidgeDevControls;
}) {
  const bridge = useBridgeState();

  useEffect(function bootRidgePreviewScene() {
    bridgeActions.closeOverlay();
    bridgeActions.clearSceneUi();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetTouch();
    bridgeActions.enterScene(RIDGE_SCENE_ID);

    return () => {
      bridgeActions.resetTouch();
      bridgeActions.closeOverlay();
      bridgeActions.clearSceneUi();
      bridgeActions.returnToOverworld();
    };
  }, []);

  return (
    <section
      className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[7px_7px_0_rgba(26,26,26,1)]"
      data-testid="ridge-runtime-preview"
    >
      <div className="absolute left-3 top-3 z-20 border-2 border-[#1a1a1a] bg-[#fbfbf9]/92 px-3 py-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
          Phaser Preview
        </p>
        <p className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
          Actual Ridge runtime - {Math.round(previewZoom * 100)}%
        </p>
      </div>
      <Game
        activeSceneId={bridge.activeSceneId}
        chrome="bare"
        isPaused={bridge.isPaused || bridge.loadingSceneId !== null}
        onEnterScene={bridgeActions.enterScene}
        onOpenOverlay={bridgeActions.openOverlay}
        onReturnToOverworld={bridgeActions.returnToOverworld}
        presentationMode="portrait-cover"
        ridgeDevControls={ridgeDevControls}
      />
      {bridge.loadingSceneId ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a1a1a]/35">
          <p className="border-2 border-[#1a1a1a] bg-[#fbfbf9] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(26,26,26,1)]">
            Loading Ridge
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ViewTab({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        'flex h-9 items-center gap-2 border-2 px-3 text-xs font-black uppercase tracking-widest transition-colors',
        active
          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9]'
          : 'border-transparent bg-transparent text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fbfbf9]'
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Toolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 p-2 shadow-[4px_4px_0_rgba(26,26,26,1)]">
      <IconButton ariaLabel="Zoom out" onClick={onZoomOut}>
        <Minus className="h-4 w-4" aria-hidden />
      </IconButton>
      <span className="min-w-14 text-center font-mono text-xs font-black">
        {Math.round(zoom * 100)}%
      </span>
      <IconButton ariaLabel="Zoom in" onClick={onZoomIn}>
        <Plus className="h-4 w-4" aria-hidden />
      </IconButton>
      <IconButton ariaLabel="Reset map view" onClick={onReset}>
        <RotateCcw className="h-4 w-4" aria-hidden />
      </IconButton>
    </div>
  );
}

function IconButton({
  ariaLabel,
  children,
  onClick
}: {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] bg-[#fbfbf9] transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PreviewPanel({
  lastTeleportLabel,
  onPreviewZoomChange,
  onPreviewZoomIn,
  onPreviewZoomOut,
  onTeleport,
  playerSnapshot,
  previewZoom,
  teleportGroups
}: {
  lastTeleportLabel: string | null;
  onPreviewZoomChange: (zoom: number) => void;
  onPreviewZoomIn: () => void;
  onPreviewZoomOut: () => void;
  onTeleport: (anchor: RidgeViewerAnchor) => void;
  playerSnapshot: RidgeDevPlayerSnapshot | null;
  previewZoom: number;
  teleportGroups: readonly {
    room: RidgeViewerRoom;
    anchors: readonly RidgeViewerAnchor[];
  }[];
}) {
  return (
    <>
      <section className="border-b-2 border-[#1a1a1a] py-4">
        <h2 className="text-lg font-black">Preview</h2>
        <p className="mt-2 text-sm font-bold text-[#5a554f]">
          Real Phaser Ridge scene. Use Model for source-backed overlays.
        </p>
        <div className="mt-3 grid gap-2">
          <div className="flex items-center gap-2">
            <IconButton ariaLabel="Zoom preview out" onClick={onPreviewZoomOut}>
              <Minus className="h-4 w-4" aria-hidden />
            </IconButton>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Preview zoom</span>
              <select
                aria-label="Preview zoom"
                className="h-8 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 font-mono text-xs font-black"
                onChange={(event) => onPreviewZoomChange(Number(event.target.value))}
                value={previewZoom}
              >
                {PREVIEW_ZOOM_OPTIONS.map((zoom) => (
                  <option key={zoom} value={zoom}>
                    {Math.round(zoom * 100)}%
                  </option>
                ))}
              </select>
            </label>
            <IconButton ariaLabel="Zoom preview in" onClick={onPreviewZoomIn}>
              <Plus className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <Detail label="Camera" value={`${Math.round(previewZoom * 100)}%`} />
            <Detail
              label="Player"
              value={playerSnapshot
                ? `${Math.round(playerSnapshot.x)}, ${Math.round(playerSnapshot.y)}`
                : 'waiting'}
            />
          </dl>
        </div>
      </section>
      <section className="py-4">
        <h2 className="text-lg font-black">Teleport</h2>
        {lastTeleportLabel ? (
          <p className="mt-2 border-2 border-[#1a1a1a] bg-[#f3df8b] px-2 py-1 text-xs font-black uppercase tracking-widest">
            Sent: {lastTeleportLabel}
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          {teleportGroups.map((group) => (
            <div key={group.room.id}>
              <p className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
                {group.room.title}
              </p>
              <div className="grid gap-1.5">
                {group.anchors.map((anchor) => (
                  <button
                    aria-label={`Teleport to ${anchor.roomTitle} ${getTeleportAnchorLabel(anchor)}`}
                    className="flex min-h-8 items-center justify-between gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-left text-xs font-black transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                    key={anchor.id}
                    onClick={() => onTeleport(anchor)}
                    type="button"
                  >
                    <span className="min-w-0 truncate">
                      {anchor.symbol} {getTeleportAnchorLabel(anchor)}
                    </span>
                    <LocateFixed className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function GridLayer({ cells }: { cells: readonly RidgeViewerTileCell[] }) {
  return (
    <g data-testid="ridge-layer-grid">
      {cells.map((cell) => (
        <rect
          key={cell.id}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
          fill={getTileFill(cell)}
          opacity={getTileOpacity(cell)}
          stroke={cell.symbol === '.' ? 'none' : '#1a1a1a'}
          strokeWidth={cell.symbol === '.' ? 0 : 1.5}
        />
      ))}
    </g>
  );
}

function RoomLayer({
  onFocusRoom,
  rooms,
  onSelect
}: {
  onFocusRoom: (roomId: string) => void;
  rooms: readonly RidgeViewerRoom[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-rooms">
      {rooms.map((room) => (
        <g
          aria-label={`Room ${room.title}`}
          key={room.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'room', id: room.id });
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onFocusRoom(room.id);
          }}
          role="button"
          tabIndex={0}
        >
          <rect
            x={room.x}
            y={room.y}
            width={room.width}
            height={room.height}
            fill="transparent"
            stroke="#1a1a1a"
            strokeDasharray="18 10"
            strokeWidth="8"
          />
          <text
            x={room.x + 18}
            y={room.y + 42}
            fill="#1a1a1a"
            fontSize="34"
            fontWeight="900"
            paintOrder="stroke"
            stroke="#fbfbf9"
            strokeWidth="10"
          >
            {room.title}
          </text>
        </g>
      ))}
    </g>
  );
}

function AnchorLayer({
  anchors,
  onSelect
}: {
  anchors: readonly RidgeViewerAnchor[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-anchors">
      {anchors.map((anchor) => (
        <g
          aria-label={`Anchor ${anchor.symbol} in ${anchor.roomTitle}: ${anchor.kind}`}
          key={anchor.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'anchor', id: anchor.id });
          }}
          role="button"
          tabIndex={0}
        >
          <circle cx={anchor.x} cy={anchor.y} r="25" fill="#ffcf5a" stroke="#1a1a1a" strokeWidth="6" />
          <text
            x={anchor.x}
            y={anchor.y + 8}
            fill="#1a1a1a"
            fontSize="24"
            fontWeight="900"
            textAnchor="middle"
          >
            {anchor.symbol}
          </text>
          <text
            x={anchor.x + 32}
            y={anchor.y - 28}
            fill="#1a1a1a"
            fontSize="21"
            fontWeight="800"
            paintOrder="stroke"
            stroke="#fbfbf9"
            strokeWidth="7"
          >
            {anchor.kind}
          </text>
        </g>
      ))}
    </g>
  );
}

function RouteLayer({
  routes,
  future = false,
  onSelect
}: {
  routes: readonly { id: string; links: readonly RidgeViewerRouteLink[] }[];
  future?: boolean;
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid={future ? 'ridge-layer-future-routes' : 'ridge-layer-routes'}>
      {routes.flatMap((route) =>
        route.links.map((link) => (
          <g
            aria-label={`${future ? 'Future route' : 'Route'} ${route.id} ${link.fromRoomId} to ${link.toRoomId}`}
            key={link.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ type: future ? 'futureRoute' : 'route', id: link.id });
            }}
            role="button"
            tabIndex={0}
          >
            <line
              x1={link.from.x}
              y1={link.from.y}
              x2={link.to.x}
              y2={link.to.y}
              stroke={future ? '#7d55c7' : '#157f76'}
              strokeDasharray={future ? '18 14' : undefined}
              strokeLinecap="round"
              strokeWidth="16"
            />
            <circle cx={link.to.x} cy={link.to.y} r="14" fill={future ? '#7d55c7' : '#157f76'} />
          </g>
        ))
      )}
    </g>
  );
}

function ShortcutLayer({
  shortcuts,
  onSelect
}: {
  shortcuts: readonly RidgeViewerShortcut[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-shortcuts">
      {shortcuts.map((shortcut) => {
        const connection = shortcut.unlockedConnection ?? shortcut.lockedConnection;
        if (!connection) return null;
        return (
          <g
            aria-label={`Shortcut ${shortcut.id}`}
            key={shortcut.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ type: 'shortcut', id: shortcut.id });
            }}
            role="button"
            tabIndex={0}
          >
            <line
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke={shortcut.unlockedAvailable ? '#d15c2f' : '#5a554f'}
              strokeDasharray="10 16"
              strokeLinecap="round"
              strokeWidth="18"
            />
            <Crosshair
              aria-hidden
              color={shortcut.unlockedAvailable ? '#d15c2f' : '#5a554f'}
              height={42}
              strokeWidth={3}
              width={42}
              x={connection.to.x - 21}
              y={connection.to.y - 21}
            />
          </g>
        );
      })}
    </g>
  );
}

function ColliderLayer({
  colliders,
  onSelect
}: {
  colliders: readonly { id: string; x: number; y: number; width: number; height: number; kind: string }[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-colliders">
      {colliders.map((collider) => (
        <rect
          aria-label={`Collider ${collider.id}`}
          fill={collider.kind === 'solid' ? '#1a1a1a' : '#2d7db3'}
          fillOpacity={collider.kind === 'solid' ? 0.32 : 0.38}
          height={collider.height}
          key={collider.id}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'collider', id: collider.id });
          }}
          role="button"
          stroke="#1a1a1a"
          strokeWidth="3"
          tabIndex={0}
          width={collider.width}
          x={collider.x - collider.width / 2}
          y={collider.y - collider.height / 2}
        />
      ))}
    </g>
  );
}

function AssistZoneLayer({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <g data-testid="ridge-layer-assist-zones">
      {model.assistZones.map((zone) => (
        <rect
          fill="#a4d46c"
          fillOpacity="0.23"
          height={zone.height}
          key={zone.id}
          stroke="#4a7f28"
          strokeDasharray="12 10"
          strokeWidth="5"
          width={zone.width}
          x={zone.x - zone.width / 2}
          y={zone.y - zone.height / 2}
        />
      ))}
    </g>
  );
}

function RectLayer({
  rects,
  onSelect
}: {
  rects: readonly RidgeViewerRect[];
  onSelect: (selection: Selection) => void;
}) {
  return (
    <g data-testid="ridge-layer-rects">
      {rects.map((rect) => (
        <rect
          aria-label={`Rect ${rect.id}`}
          fill="#f0a7c8"
          fillOpacity="0.18"
          height={rect.height}
          key={`${rect.roomId}:${rect.id}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect({ type: 'rect', id: `${rect.roomId}:${rect.id}` });
          }}
          role="button"
          stroke="#b13b75"
          strokeDasharray="10 8"
          strokeWidth="5"
          tabIndex={0}
          width={rect.width}
          x={rect.x}
          y={rect.y}
        />
      ))}
    </g>
  );
}

function PlayerSnapshotLayer({ snapshot }: { snapshot: RidgeDevPlayerSnapshot }) {
  return (
    <g data-testid="ridge-layer-player-snapshot" pointerEvents="none">
      <circle
        cx={snapshot.x}
        cy={snapshot.y}
        fill="#f3df8b"
        r="22"
        stroke="#1a1a1a"
        strokeWidth="6"
      />
      <line
        x1={snapshot.x - 34}
        x2={snapshot.x + 34}
        y1={snapshot.y}
        y2={snapshot.y}
        stroke="#1a1a1a"
        strokeWidth="5"
      />
      <line
        x1={snapshot.x}
        x2={snapshot.x}
        y1={snapshot.y - 34}
        y2={snapshot.y + 34}
        stroke="#1a1a1a"
        strokeWidth="5"
      />
      <text
        x={snapshot.x + 34}
        y={snapshot.y - 28}
        fill="#1a1a1a"
        fontSize="21"
        fontWeight="900"
        paintOrder="stroke"
        stroke="#fbfbf9"
        strokeWidth="7"
      >
        player
      </text>
    </g>
  );
}

function SummaryPanel({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <section className="border-b-2 border-[#1a1a1a] pb-4">
      <h2 className="text-lg font-black">World</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Detail label="World" value={model.worldId} />
        <Detail label="Cell" value={`${model.cell}px`} />
        <Detail label="Rooms" value={String(model.rooms.length)} />
        <Detail label="Tiles" value={String(model.tileRegistry.length)} />
        <Detail label="Source" value={model.sourceWorldId} />
        <Detail label="Generated" value={model.generatedWorldId} />
      </dl>
      <p
        className="mt-3 border-2 border-[#1a1a1a] bg-[#d7f2d1] px-3 py-2 text-xs font-black uppercase tracking-widest"
        data-testid="ridge-viewer-validation-status"
      >
        {model.validationErrors.length === 0
          ? 'Validation clean'
          : `${model.validationErrors.length} validation errors`}
      </p>
    </section>
  );
}

function RoomFocusPanel({
  model,
  onFocusRoom
}: {
  model: RidgeBlockoutViewerModel;
  onFocusRoom: (roomId: string) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Focus</h2>
      <label className="mt-3 block">
        <span className="sr-only">Focus room</span>
        <select
          aria-label="Focus room"
          className="h-9 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 text-sm font-black"
          defaultValue=""
          onChange={(event) => {
            if (event.target.value) onFocusRoom(event.target.value);
          }}
        >
          <option value="" disabled>
            Pick a room
          </option>
          {model.rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.title}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs font-bold text-[#5a554f]">
        Double-click a room outline to focus it directly.
      </p>
    </section>
  );
}

function LayerPanel({
  layers,
  onToggle
}: {
  layers: LayerState;
  onToggle: (layerId: RidgeViewerLayerId) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Layers</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
        {(Object.keys(LAYER_LABELS) as RidgeViewerLayerId[]).map((layerId) => (
          <label
            className="flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1.5 transition-colors hover:bg-[#efe8d8]"
            key={layerId}
          >
            <input
              checked={layers[layerId]}
              className="h-4 w-4 cursor-pointer accent-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              onChange={() => onToggle(layerId)}
              type="checkbox"
            />
            <span>{LAYER_LABELS[layerId]}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function RoutePanel({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Topology</h2>
      <div className="mt-3 space-y-3 text-sm">
        {model.routes.map((route) => (
          <div key={route.id}>
            <p className="font-black">Route: {route.id}</p>
            <p className="text-xs leading-relaxed text-[#5a554f]">{route.roomIds.join(' -> ')}</p>
          </div>
        ))}
        <div>
          <p className="font-black">Future routes</p>
          <p className="text-xs leading-relaxed text-[#5a554f]">
            {model.futureRoutes.map((route) => route.id).join(', ')}
          </p>
        </div>
        <div>
          <p className="font-black">Shortcuts</p>
          <ul className="mt-1 space-y-1 text-xs text-[#5a554f]">
            {model.shortcuts.map((shortcut) => (
              <li key={shortcut.id}>
                {shortcut.id}: {shortcut.lockedAvailable ? 'available' : 'locked'} /{' '}
                {shortcut.unlockedAvailable ? 'unlocked with Stampede' : 'still locked'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SelectionPanel({ details }: { details: readonly [string, string][] | null }) {
  return (
    <section className="py-4">
      <h2 className="text-lg font-black">Selected</h2>
      {details ? (
        <dl className="mt-3 grid gap-2 text-sm" data-testid="ridge-viewer-selection">
          {details.map(([label, value]) => (
            <Detail key={label} label={label} value={value} />
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm font-bold text-[#5a554f]">None</p>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
        {label}
      </dt>
      <dd className="min-w-0 break-words font-bold text-[#1a1a1a]">{value}</dd>
    </>
  );
}

function getTileFill(cell: RidgeViewerTileCell): string {
  if (cell.tile?.kind === 'solid') return '#1a1a1a';
  if (cell.tile?.kind === 'platform') return '#2d7db3';
  if (cell.tile?.kind === 'ladder') return '#8a63d2';
  if (cell.tile?.kind === 'anchor') return '#ffcf5a';
  if (cell.tile?.kind === 'design') return '#f0a7c8';
  return '#fbfbf9';
}

function getTileOpacity(cell: RidgeViewerTileCell): number {
  if (cell.symbol === '.') return 0.18;
  if (cell.tile?.kind === 'design') return 0.35;
  if (cell.tile?.kind === 'anchor') return 0.5;
  return 0.7;
}

function clampModelZoom(value: number): number {
  return Math.min(1.2, Math.max(0.05, roundForTransform(value)));
}

function clampPreviewZoom(value: number): number {
  return Math.min(1.6, Math.max(0.65, roundForTransform(value)));
}

function roundForTransform(value: number): number {
  return Math.round(value * 100) / 100;
}

function getWorldTransform(view: typeof INITIAL_VIEW): string {
  return `translate(${view.panX} ${view.panY}) scale(${view.zoom})`;
}

function getTeleportGroups(
  model: RidgeBlockoutViewerModel
): readonly { room: RidgeViewerRoom; anchors: readonly RidgeViewerAnchor[] }[] {
  return model.rooms
    .map((room) => ({
      room,
      anchors: model.anchors
        .filter((anchor) => anchor.roomId === room.id)
        .sort(compareTeleportAnchors)
    }))
    .filter((group) => group.anchors.length > 0);
}

function compareTeleportAnchors(left: RidgeViewerAnchor, right: RidgeViewerAnchor): number {
  const priorityDelta = getTeleportAnchorPriority(left) - getTeleportAnchorPriority(right);
  if (priorityDelta !== 0) return priorityDelta;
  return getTeleportAnchorLabel(left).localeCompare(getTeleportAnchorLabel(right));
}

function getTeleportAnchorPriority(anchor: RidgeViewerAnchor): number {
  if (anchor.kind === 'player_spawn') return 0;
  if (anchor.kind === 'exit') return 1;
  if (anchor.attrId || anchor.label) return 2;
  return 3;
}

function getTeleportAnchorLabel(anchor: RidgeViewerAnchor): string {
  return anchor.label ?? anchor.attrId ?? anchor.targetRoomId ?? anchor.kind;
}

function readInitialViewerView(): ViewerView {
  if (typeof window === 'undefined') return 'preview';
  return new URLSearchParams(window.location.search).get('view') === 'model'
    ? 'model'
    : 'preview';
}

function writeViewerViewToUrl(view: ViewerView): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'ridge-blockout');
  url.searchParams.set('view', view);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function getSelectionDetails(
  model: RidgeBlockoutViewerModel,
  selection: Selection
): readonly [string, string][] | null {
  if (selection.type === 'room') {
    const room = model.rooms.find((candidate) => candidate.id === selection.id);
    return room
      ? [
        ['Type', 'room'],
        ['Id', room.id],
        ['Title', room.title],
        ['Theme', room.theme ?? 'none'],
        ['Mood', room.mood ?? 'none']
      ]
      : null;
  }
  if (selection.type === 'anchor') {
    const anchor = model.anchors.find((candidate) => candidate.id === selection.id);
    return anchor
      ? [
        ['Type', 'anchor'],
        ['Symbol', anchor.symbol],
        ['Kind', anchor.kind],
        ['Room', anchor.roomId],
        ['Id', anchor.attrId ?? 'none'],
        ['Target', anchor.targetRoomId ?? 'none'],
        ['Requires', anchor.requires ?? 'none'],
        ['Movement', anchor.movement ?? 'none']
      ]
      : null;
  }
  if (selection.type === 'shortcut') {
    const shortcut = model.shortcuts.find((candidate) => candidate.id === selection.id);
    return shortcut
      ? [
        ['Type', 'shortcut'],
        ['Id', shortcut.id],
        ['From', shortcut.fromRoomId],
        ['To', shortcut.toRoomId],
        ['Required', shortcut.requiredStampId ?? 'none'],
        ['Empty progress', shortcut.lockedAvailable ? 'available' : 'locked'],
        ['Stampede progress', shortcut.unlockedAvailable ? 'available' : 'locked']
      ]
      : null;
  }
  if (selection.type === 'collider') {
    const collider = model.colliders.find((candidate) => candidate.id === selection.id);
    return collider
      ? [
        ['Type', 'collider'],
        ['Id', collider.id],
        ['Kind', collider.kind],
        ['Room', collider.roomId ?? 'generated'],
        ['Movement', collider.movement ?? 'none']
      ]
      : null;
  }
  if (selection.type === 'rect') {
    const [roomId, rectId] = selection.id.split(':');
    const rect = model.rects.find((candidate) =>
      candidate.roomId === roomId && candidate.id === rectId
    );
    return rect
      ? [
        ['Type', 'rect'],
        ['Id', rect.id],
        ['Room', rect.roomId],
        ['Attrs', Object.entries(rect.attrs).map(([key, value]) => `${key}=${value}`).join(', ') || 'none']
      ]
      : null;
  }

  const routePool = selection.type === 'route' ? model.routes : model.futureRoutes;
  const link = routePool.flatMap((route) => route.links).find((candidate) =>
    candidate.id === selection.id
  );
  return link
    ? [
      ['Type', selection.type],
      ['Route', link.routeId],
      ['From', link.fromRoomId],
      ['To', link.toRoomId],
      ['Movement', link.movement ?? 'promise']
    ]
    : null;
}
