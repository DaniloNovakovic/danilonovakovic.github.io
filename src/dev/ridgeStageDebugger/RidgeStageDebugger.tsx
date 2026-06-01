import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bug,
  Crosshair,
  Gauge,
  LocateFixed,
  Minus,
  Plus,
  RotateCcw,
  Route,
  Waypoints
} from 'lucide-react';
import {
  useBridgeState,
  type RidgeBridgeBeatState
} from '@/game/bridge/store';
import type {
  RidgeDevDebugSettings,
  RidgeDevPlayerSnapshot
} from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageSpot,
  type BridgeStageSpotId,
  type ResolvedBridgeStageSpot
} from '@/game/scenes/ridge/bridge/stageComposition';
import {
  RidgeRuntimePreview,
  type RidgePreviewInputOwner
} from './RidgeRuntimePreview';
import { IconButton } from './components/IconButton';
import { Detail } from './components/Detail';
import { PREVIEW_ZOOM_OPTIONS } from './constants';
import { useRidgePreviewControls } from './hooks/useRidgePreviewControls';

const BRIDGE_BEAT_OPTIONS = [
  { id: 'intro', label: 'Intro' },
  { id: 'needs_toy_car', label: 'Needs Car' },
  { id: 'toy_car_shared', label: 'Shared Car' },
  { id: 'bridge_complete', label: 'Bridge Complete' },
  { id: 'concert_handoff', label: 'Concert Handoff' }
] as const satisfies readonly { id: RidgeBridgeBeatState; label: string }[];

const STAGE_SPOT_GROUPS = [
  {
    title: 'Player Rail',
    spotIds: ['spawn', 'bridge-left-bank', 'bridge-center', 'bridge-right-bank', 'concert-exit']
  },
  {
    title: 'Cast + Props',
    spotIds: ['cicka-play', 'cicka-settled', 'draftsperson', 'cicka-toy-car', 'blueprint']
  },
  {
    title: 'Bridge Test',
    spotIds: ['toy-car-test-start', 'toy-car-test-end', 'handoff-note']
  }
] as const satisfies readonly { title: string; spotIds: readonly BridgeStageSpotId[] }[];

export default function RidgeStageDebugger() {
  const bridge = useBridgeState();
  const [previewInputOwner, setPreviewInputOwner] = useState<RidgePreviewInputOwner>('game');
  const previewControls = useRidgePreviewControls();
  const claimPanelInput = useCallback(() => setPreviewInputOwner('panel'), []);
  const claimGameInput = useCallback(() => setPreviewInputOwner('game'), []);
  const routeState = bridge.progress.ridge.firstPlayableRoute;
  const resolvedSpots = useMemo(
    () => BRIDGE_STAGE_SOURCE.spots.map((spot) => resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, spot.id)),
    []
  );
  const spotsById = useMemo(() => {
    const next = new Map<BridgeStageSpotId, ResolvedBridgeStageSpot>();
    resolvedSpots.forEach((spot) => next.set(spot.id, spot));
    return next;
  }, [resolvedSpots]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f4f1ea] text-[#1a1a1a]">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2 lg:p-3">
        <header
          className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-[3px] border-[#1a1a1a] bg-[#fbfbf9] px-3 py-2 shadow-[4px_4px_0_rgba(26,26,26,1)]"
          onFocusCapture={claimPanelInput}
          onPointerDownCapture={claimPanelInput}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#5a554f]">
              Dev QA
            </p>
            <h1 className="text-sm font-black uppercase sm:text-base">
              Ridge Stage Debugger
            </h1>
            <StatusChip label="Bridge" />
            <StatusChip label={routeState.bridgeBeat} tone={routeState.activeAreaId === 'bridge' ? 'green' : 'yellow'} />
          </div>
          <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
            <Waypoints className="h-4 w-4" aria-hidden />
            <span>{BRIDGE_STAGE_SOURCE.primaryWalkRail.points.length} rail pts</span>
          </div>
        </header>

        <main className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_minmax(260px,38dvh)] gap-2 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-none">
          <div className="relative h-full min-h-0 min-w-0">
            <RidgeRuntimePreview
              inputOwner={previewInputOwner}
              isActive
              onClaimGameInput={claimGameInput}
              previewZoom={previewControls.previewZoom}
              ridgeDevControls={previewControls.ridgeDevControls}
            />
          </div>

          <aside
            className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 shadow-[7px_7px_0_rgba(26,26,26,1)]"
            onFocusCapture={claimPanelInput}
            onPointerDownCapture={claimPanelInput}
          >
            <StageSourcePanel spotCount={resolvedSpots.length} />
            <PreviewPanel
              lastCommandLabel={previewControls.lastCommandLabel}
              onPreviewZoomChange={previewControls.setPreviewZoomLevel}
              onPreviewZoomIn={() => previewControls.adjustPreviewZoom(0.25)}
              onPreviewZoomOut={() => previewControls.adjustPreviewZoom(-0.25)}
              onResetPlayer={previewControls.requestPlayerReset}
              playerSnapshot={previewControls.playerSnapshot}
              previewZoom={previewControls.previewZoom}
            />
            <RouteBeatPanel
              activeBeat={routeState.bridgeBeat}
              onBridgeBeatChange={previewControls.requestBridgeBeat}
            />
            <DebugPanel
              debugSettings={previewControls.debugSettings}
              onToggleDebugSetting={previewControls.toggleDebugSetting}
            />
            <StageSpotPanel
              onTeleport={previewControls.requestStageSpotTeleport}
              spotsById={spotsById}
            />
          </aside>
        </main>
      </div>
    </div>
  );
}

function StageSourcePanel({ spotCount }: { spotCount: number }) {
  return (
    <section className="border-b-2 border-[#1a1a1a] pb-4">
      <SectionTitle icon={<Gauge className="h-4 w-4" aria-hidden />} title="Stage Source" />
      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        <Detail label="Stage" value={BRIDGE_STAGE_SOURCE.id} />
        <Detail
          label="Canvas"
          value={`${BRIDGE_STAGE_SOURCE.canvas.width}x${BRIDGE_STAGE_SOURCE.canvas.height}`}
        />
        <Detail
          label="Camera"
          value={`${BRIDGE_STAGE_SOURCE.cameraBounds.width}x${BRIDGE_STAGE_SOURCE.cameraBounds.height}`}
        />
        <Detail label="Spots" value={String(spotCount)} />
        <Detail label="Plates" value={String(BRIDGE_STAGE_SOURCE.plates.length)} />
        <Detail label="Objects" value={String(BRIDGE_STAGE_SOURCE.objects.length)} />
        <Detail label="Occluders" value={String(BRIDGE_STAGE_SOURCE.occluders.length)} />
      </dl>
    </section>
  );
}

function PreviewPanel({
  lastCommandLabel,
  onPreviewZoomChange,
  onPreviewZoomIn,
  onPreviewZoomOut,
  onResetPlayer,
  playerSnapshot,
  previewZoom
}: {
  lastCommandLabel: string | null;
  onPreviewZoomChange: (zoom: number) => void;
  onPreviewZoomIn: () => void;
  onPreviewZoomOut: () => void;
  onResetPlayer: () => void;
  playerSnapshot: RidgeDevPlayerSnapshot | null;
  previewZoom: number;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <SectionTitle icon={<Crosshair className="h-4 w-4" aria-hidden />} title="Live Player" />
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
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
          <Detail
            label="Player"
            value={playerSnapshot
              ? `${Math.round(playerSnapshot.x)}, ${Math.round(playerSnapshot.y)}`
              : 'waiting'}
          />
          <Detail
            label="Rail"
            value={playerSnapshot?.railProgress !== undefined
              ? `${playerSnapshot.railProgress.toFixed(3)} @ ${playerSnapshot.nearestStageSpotId ?? 'spot?'}`
              : 'waiting'}
          />
          <Detail
            label="Cue"
            value={playerSnapshot?.railScale !== undefined && playerSnapshot.railDepth !== undefined
              ? `scale ${playerSnapshot.railScale.toFixed(2)} / depth ${playerSnapshot.railDepth}`
              : 'waiting'}
          />
          <Detail
            label="Range"
            value={playerSnapshot?.playerProgressMax !== undefined
              ? `0.000-${playerSnapshot.playerProgressMax.toFixed(3)}`
              : 'waiting'}
          />
          <Detail
            label="Crossing"
            value={playerSnapshot?.crossingOpen === undefined
              ? 'waiting'
              : playerSnapshot.crossingOpen ? 'open' : 'blocked'}
          />
          <Detail label="Beat" value={playerSnapshot?.bridgeBeat ?? 'waiting'} />
        </dl>
        {playerSnapshot?.sourceSnippet ? (
          <input
            aria-label="Copyable Ridge Stage Source snippet"
            className="h-8 w-full border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 font-mono text-[10px] font-black"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            value={playerSnapshot.sourceSnippet}
          />
        ) : null}
        {lastCommandLabel ? (
          <p className="border-2 border-[#1a1a1a] bg-[#f3df8b] px-2 py-1 text-xs font-black uppercase tracking-widest">
            Sent: {lastCommandLabel}
          </p>
        ) : null}
        <button
          className="flex min-h-9 items-center justify-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
          onClick={onResetPlayer}
          type="button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset Player
        </button>
      </div>
    </section>
  );
}

function RouteBeatPanel({
  activeBeat,
  onBridgeBeatChange
}: {
  activeBeat: RidgeBridgeBeatState;
  onBridgeBeatChange: (bridgeBeat: RidgeBridgeBeatState) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <SectionTitle icon={<Route className="h-4 w-4" aria-hidden />} title="Route Beat" />
      <div className="mt-3 grid gap-1.5">
        {BRIDGE_BEAT_OPTIONS.map((beat) => {
          const active = beat.id === activeBeat;
          return (
            <button
              aria-pressed={active}
              className={[
                'flex min-h-9 items-center justify-between gap-2 border-2 border-[#1a1a1a] px-2 py-1 text-left text-xs font-black uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]',
                active
                  ? 'bg-[#1a1a1a] text-[#fbfbf9]'
                  : 'bg-[#fbfbf9] hover:bg-[#1a1a1a] hover:text-[#fbfbf9]'
              ].join(' ')}
              key={beat.id}
              onClick={() => onBridgeBeatChange(beat.id)}
              type="button"
            >
              <span>{beat.label}</span>
              <span className="font-mono text-[10px]">{beat.id}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DebugPanel({
  debugSettings,
  onToggleDebugSetting
}: {
  debugSettings: RidgeDevDebugSettings;
  onToggleDebugSetting: (setting: keyof RidgeDevDebugSettings) => void;
}) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <SectionTitle icon={<Bug className="h-4 w-4" aria-hidden />} title="Overlays" />
      <div className="mt-3 grid gap-2">
        <DebugToggle
          checked={debugSettings.graybox}
          label="Stage Frame"
          onChange={() => onToggleDebugSetting('graybox')}
        />
        <DebugToggle
          checked={debugSettings.showTraversalAssists}
          label="Walk Rail + Spots"
          onChange={() => onToggleDebugSetting('showTraversalAssists')}
        />
        <DebugToggle
          checked={debugSettings.showInteractZones}
          label="Interaction Zones"
          onChange={() => onToggleDebugSetting('showInteractZones')}
        />
        <DebugToggle
          checked={debugSettings.showPlayerBody}
          label="Player Body"
          onChange={() => onToggleDebugSetting('showPlayerBody')}
        />
      </div>
    </section>
  );
}

function StageSpotPanel({
  onTeleport,
  spotsById
}: {
  onTeleport: (spotId: BridgeStageSpotId) => void;
  spotsById: ReadonlyMap<BridgeStageSpotId, ResolvedBridgeStageSpot>;
}) {
  return (
    <section className="pt-4">
      <SectionTitle icon={<LocateFixed className="h-4 w-4" aria-hidden />} title="Stage Spots" />
      <div className="mt-3 space-y-3">
        {STAGE_SPOT_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
              {group.title}
            </p>
            <div className="grid gap-1.5">
              {group.spotIds.map((spotId) => {
                const spot = spotsById.get(spotId);
                if (!spot) return null;
                return (
                  <button
                    aria-label={`Move player to Stage Spot ${spot.id}`}
                    className="flex min-h-8 items-center justify-between gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-left text-xs font-black transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                    key={spot.id}
                    onClick={() => onTeleport(spot.id)}
                    type="button"
                  >
                    <span className="min-w-0 truncate">{spot.id}</span>
                    <span className="shrink-0 font-mono text-[10px]">
                      {spot.railProgress.toFixed(3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DebugToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-1 text-xs font-black uppercase tracking-wider">
      <input
        checked={checked}
        className="h-4 w-4 accent-[#1a1a1a]"
        onChange={onChange}
        type="checkbox"
      />
      <span className="min-w-0">{label}</span>
    </label>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
      {icon}
      <span>{title}</span>
    </h2>
  );
}

function StatusChip({
  label,
  tone = 'paper'
}: {
  label: string;
  tone?: 'green' | 'paper' | 'yellow';
}) {
  const toneClass = {
    green: 'bg-[#d7f2d1]',
    paper: 'bg-[#fbfbf9]',
    yellow: 'bg-[#f3df8b]'
  }[tone];
  return (
    <span
      className={[
        'min-w-0 truncate border-2 border-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]',
        toneClass
      ].join(' ')}
    >
      {label}
    </span>
  );
}
