import { useMemo, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react';
import {
  Crosshair,
  Minus,
  Plus,
  RotateCcw
} from 'lucide-react';
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

const INITIAL_VIEW = {
  zoom: 0.12,
  panX: 42,
  panY: 30
};

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
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [view, setView] = useState(INITIAL_VIEW);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const selectedDetails = selection ? getSelectionDetails(model, selection) : null;
  const transform = `translate(${view.panX} ${view.panY}) scale(${view.zoom})`;

  const toggleLayer = (layerId: RidgeViewerLayerId) => {
    setLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  };
  const adjustZoom = (delta: number) => {
    setView((current) => ({ ...current, zoom: clampZoom(current.zoom + delta) }));
  };
  const resetView = () => setView(INITIAL_VIEW);
  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? 0.02 : -0.02);
  };
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY });
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    setDragStart({ x: event.clientX, y: event.clientY });
    setView((current) => ({
      ...current,
      panX: Math.round((current.panX + dx) * 100) / 100,
      panY: Math.round((current.panY + dy) * 100) / 100
    }));
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a1a1a]">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 lg:p-4">
        <header className="flex min-w-0 flex-col items-start justify-between gap-3 border-4 border-[#1a1a1a] bg-[#fbfbf9] px-4 py-3 shadow-[7px_7px_0_rgba(26,26,26,1)] sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#5a554f]">
              Dev QA
            </p>
            <h1 className="text-2xl font-black leading-none sm:text-3xl">
              Ridge Blockout Viewer
            </h1>
          </div>
          <div className="grid min-w-0 gap-1 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-[#5a554f] sm:text-right sm:text-xs">
            <span>{model.title}</span>
            <span>{model.validationErrors.length === 0 ? 'Validation clean' : 'Validation failed'}</span>
          </div>
        </header>

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(220px,35dvh)] gap-3 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-none">
          <section className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fdfcf7] shadow-[7px_7px_0_rgba(26,26,26,1)]">
            <Toolbar
              zoom={view.zoom}
              onZoomIn={() => adjustZoom(0.02)}
              onZoomOut={() => adjustZoom(-0.02)}
              onReset={resetView}
            />
            <svg
              aria-label="Ridge blockout map canvas"
              className="h-full min-h-0 w-full cursor-grab touch-none bg-[#fbfbf9]"
              data-testid="ridge-blockout-svg"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDragStart(null)}
              onPointerCancel={() => setDragStart(null)}
              onWheel={handleWheel}
              role="img"
            >
              <defs>
                <pattern id="ridge-viewer-paper-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d8d0bf" strokeWidth="2" />
                </pattern>
              </defs>
              <g data-testid="ridge-viewer-world" transform={transform}>
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
                {layers.rooms ? <RoomLayer rooms={model.rooms} onSelect={setSelection} /> : null}
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
              </g>
            </svg>
          </section>

          <aside className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 shadow-[7px_7px_0_rgba(26,26,26,1)]">
            <SummaryPanel model={model} />
            <LayerPanel layers={layers} onToggle={toggleLayer} />
            <RoutePanel model={model} />
            <SelectionPanel details={selectedDetails} />
          </aside>
        </main>
      </div>
    </div>
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
  rooms,
  onSelect
}: {
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
            className="flex items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1.5"
            key={layerId}
          >
            <input
              checked={layers[layerId]}
              className="h-4 w-4 accent-[#1a1a1a]"
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

function clampZoom(value: number): number {
  return Math.min(0.32, Math.max(0.05, Math.round(value * 100) / 100));
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
